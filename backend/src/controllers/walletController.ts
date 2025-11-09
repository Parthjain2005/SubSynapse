import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import User from '../models/User.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import { AppError } from '../middleware/errorHandler.js';

export const getBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      balance: user.creditBalance,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const requestWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { amount, upiId } = req.body;

    if (amount < 500) {
      throw new AppError('Minimum withdrawal amount is 500 credits', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.creditBalance < amount) {
      throw new AppError('Insufficient balance', 400);
    }

    const pendingWithdrawal = await WithdrawalRequest.findOne({
      userId,
      status: 'pending',
    });

    if (pendingWithdrawal) {
      throw new AppError('You already have a pending withdrawal request', 400);
    }

    const withdrawalRequest = await WithdrawalRequest.create({
      userId,
      amount,
      upiId,
      status: 'pending',
      requestedAt: new Date(),
    });

    res.status(201).json({
      message: 'Withdrawal request submitted successfully',
      request: withdrawalRequest,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getWithdrawalHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const requests = await WithdrawalRequest.find({ userId }).sort({ requestedAt: -1 });

    res.status(200).json({ requests });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
