import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Membership from '../models/Membership.js';
import SubscriptionGroup from '../models/SubscriptionGroup.js';
import { AppError } from '../middleware/errorHandler.js';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({ user });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, email } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw new AppError('Email already in use', 400);
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        creditBalance: user.creditBalance,
        avatarUrl: user.avatarUrl,
      }
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ userId });

    res.status(200).json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getMySubscriptions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const memberships = await Membership.find({
      userId,
      status: 'active'
    }).populate('groupId');

    const subscriptions = memberships.map(membership => {
      const group = membership.groupId as any;
      return {
        id: membership._id,
        groupId: group._id,
        name: group.name,
        icon: group.icon,
        myShare: membership.myShare,
        membershipType: membership.membershipType,
        nextPaymentDate: membership.nextPaymentDate,
        endDate: membership.endDate,
        status: membership.status,
        joinedAt: membership.joinedAt,
        credentials: {
          username: group.credentials.username,
          password: group.credentials.password,
        },
      };
    });

    res.status(200).json({ subscriptions });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const activeMemberships = await Membership.countDocuments({
      userId,
      status: 'active'
    });

    const memberships = await Membership.find({
      userId,
      status: 'active'
    }).populate('groupId');

    const totalSavings = memberships.reduce((sum, membership) => {
      const group = membership.groupId as any;
      const fullPrice = group.totalPrice;
      const savings = fullPrice - membership.myShare;
      return sum + savings;
    }, 0);

    res.status(200).json({
      stats: {
        activeSubscriptions: activeMemberships,
        totalSavings: Math.round(totalSavings),
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
