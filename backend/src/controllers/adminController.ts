import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/index.js';
import User from '../models/User.js';
import SubscriptionGroup from '../models/SubscriptionGroup.js';
import Membership from '../models/Membership.js';
import Transaction from '../models/Transaction.js';
import WithdrawalRequest from '../models/WithdrawalRequest.js';
import { AppError } from '../middleware/errorHandler.js';

export const getDashboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const activeGroups = await SubscriptionGroup.countDocuments({ status: 'active' });
    const pendingApprovals = await SubscriptionGroup.countDocuments({ status: 'pending_review' });
    const pendingWithdrawals = await WithdrawalRequest.countDocuments({ status: 'pending' });

    const totalRevenue = await Transaction.aggregate([
      { $match: { type: 'credit_add', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.status(200).json({
      stats: {
        totalUsers,
        activeGroups,
        pendingApprovals,
        pendingWithdrawals,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getPendingGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const groups = await SubscriptionGroup.find({ status: 'pending_review' })
      .populate('ownerId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SubscriptionGroup.countDocuments({ status: 'pending_review' });

    res.status(200).json({
      groups,
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

export const approveGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const group = await SubscriptionGroup.findById(id);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    if (group.status !== 'pending_review') {
      throw new AppError('Group is not pending review', 400);
    }

    group.status = 'active';
    await group.save();

    res.status(200).json({
      message: 'Group approved successfully',
      group,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const rejectGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const group = await SubscriptionGroup.findById(id);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    if (group.status !== 'pending_review') {
      throw new AppError('Group is not pending review', 400);
    }

    group.status = 'rejected';
    await group.save();

    res.status(200).json({
      message: 'Group rejected successfully',
      reason: reason || 'No reason provided',
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getAllWithdrawals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const requests = await WithdrawalRequest.find(query)
      .populate('userId', 'name email')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await WithdrawalRequest.countDocuments(query);

    res.status(200).json({
      requests,
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

export const processWithdrawal = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { action, adminNotes } = req.body;
    const adminId = req.user?.userId;

    if (!['approve', 'reject'].includes(action)) {
      throw new AppError('Invalid action', 400);
    }

    const withdrawal = await WithdrawalRequest.findById(id).session(session);
    if (!withdrawal) {
      throw new AppError('Withdrawal request not found', 404);
    }

    if (withdrawal.status !== 'pending') {
      throw new AppError('Withdrawal request already processed', 400);
    }

    if (action === 'approve') {
      const user = await User.findById(withdrawal.userId).session(session);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.creditBalance < withdrawal.amount) {
        throw new AppError('User has insufficient balance', 400);
      }

      user.creditBalance -= withdrawal.amount;
      await user.save({ session });

      await Transaction.create([{
        userId: withdrawal.userId,
        type: 'withdrawal',
        amount: -withdrawal.amount,
        description: `Withdrawal to UPI: ${withdrawal.upiId}`,
        status: 'completed',
        metadata: { withdrawalId: withdrawal._id, upiId: withdrawal.upiId },
      }], { session });

      withdrawal.status = 'approved';
    } else {
      withdrawal.status = 'rejected';
    }

    withdrawal.adminNotes = adminNotes || '';
    withdrawal.processedAt = new Date();
    withdrawal.processedBy = new mongoose.Types.ObjectId(adminId);
    await withdrawal.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      message: `Withdrawal ${action}d successfully`,
      withdrawal,
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(error.statusCode || 500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const query: any = { role: 'user' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      users,
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

export const getAllTransactions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments();

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

export const getAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const last30Days = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const revenueByDay = await Transaction.aggregate([
      {
        $match: {
          type: 'credit_add',
          status: 'completed',
          createdAt: { $gte: last30Days },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: last30Days },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const popularServices = await Membership.aggregate([
      { $match: { status: 'active' } },
      {
        $lookup: {
          from: 'subscriptiongroups',
          localField: 'groupId',
          foreignField: '_id',
          as: 'group',
        },
      },
      { $unwind: '$group' },
      {
        $group: {
          _id: '$group.name',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.status(200).json({
      analytics: {
        revenueByDay,
        userGrowth,
        popularServices,
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
