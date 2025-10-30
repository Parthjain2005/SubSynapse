import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../services/auth.service';
import { EmailService } from '../services/email.service';
import { generateOtp, generateSecureToken } from '../utils/crypto.util';
import { createAuditLog } from '../services/audit.service';

const prisma = new PrismaClient();

export class AuthController {
  public static async register(req: Request, res: Response): Promise<Response> {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'User already exists' });
      }

      const hashedPassword = await AuthService.hashPassword(password);
      const verificationToken = generateOtp();
      const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const user = await prisma.user.create({
        data: {
          email,
          name,
          password_hash: hashedPassword,
        },
      });

      await prisma.email_Verifications.create({
        data: {
          user_id: user.id,
          token: verificationToken,
          expires_at: verificationTokenExpires,
        },
      });

      await EmailService.sendVerificationEmail(email, verificationToken);
      await createAuditLog(user.id, 'USER_REGISTER', 'User', undefined, JSON.stringify(user));

      return res.status(201).json({ message: 'User registered. Please check your email for verification OTP.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async verifyEmail(req: Request, res: Response): Promise<Response> {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    try {
      const verification = await prisma.email_Verifications.findUnique({
        where: {
          token,
        },
      });

      if (!verification || verification.expires_at < new Date() || verification.used_at) {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }

      await prisma.user.update({
        where: { id: verification.user_id },
        data: {
          is_verified: true,
        },
      });

      await prisma.email_Verifications.update({
        where: { id: verification.id },
        data: {
          used_at: new Date(),
        },
      });

      return res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async login(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isPasswordValid = await AuthService.comparePasswords(password, user.password_hash);

      if (!isPasswordValid) {
        await createAuditLog(user.id, 'LOGIN_FAILURE', 'User');
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.is_verified) {
        return res.status(403).json({ message: 'Please verify your email before logging in.' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          last_login: new Date(),
        },
      });

      const { accessToken, refreshToken } = AuthService.generateTokens(user);

      await createAuditLog(user.id, 'LOGIN_SUCCESS', 'User');
      return res.status(200).json({ accessToken, refreshToken });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async forgotPassword(req: Request, res: Response): Promise<Response> {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        const passwordResetToken = generateSecureToken();
        const passwordResetTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.password_Reset_Tokens.create({
            data: {
                user_id: user.id,
                token: passwordResetToken,
                expires_at: passwordResetTokenExpires,
            },
        });

        await EmailService.sendPasswordResetEmail(email, passwordResetToken);
      }

      // Always return a success message to prevent email enumeration
      return res.status(200).json({ message: 'If a user with that email exists, a password reset link has been sent.' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async resetPassword(req: Request, res: Response): Promise<Response> {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'New password is required' });
    }

    try {
        const resetToken = await prisma.password_Reset_Tokens.findUnique({
            where: {
                token,
            },
        });

        if (!resetToken || resetToken.expires_at < new Date() || resetToken.used_at) {
            return res.status(400).json({ message: 'Invalid or expired password reset token' });
        }

      const hashedPassword = await AuthService.hashPassword(password);

      await prisma.user.update({
        where: { id: resetToken.user_id },
        data: {
          password_hash: hashedPassword,
        },
      });

        await prisma.password_Reset_Tokens.update({
            where: { id: resetToken.id },
            data: {
                used_at: new Date(),
            },
        });

      await createAuditLog(resetToken.user_id, 'PASSWORD_RESET', 'User');
      return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  public static async validateResetToken(req: Request, res: Response): Promise<Response> {
    const { token } = req.params;

    try {
        const resetToken = await prisma.password_Reset_Tokens.findUnique({
            where: {
                token,
            },
        });

        if (!resetToken || resetToken.expires_at < new Date() || resetToken.used_at) {
            return res.status(400).json({ message: 'Invalid or expired password reset token' });
        }

      return res.status(200).json({ message: 'Token is valid' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
