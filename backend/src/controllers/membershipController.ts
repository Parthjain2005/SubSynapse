import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/index.js';
import Membership from '../models/Membership.js';
import SubscriptionGroup from '../models/SubscriptionGroup.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { AppError } from '../middleware/errorHandler.js';

export const joinGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.userId;
    const { groupId, membershipType, days } = req.body;

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const group = await SubscriptionGroup.findById(groupId).session(session);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    if (group.status !== 'active') {
      throw new AppError('Group is not available for joining', 400);
    }

    if (group.slotsFilled >= group.slotsTotal) {
      throw new AppError('No available slots in this group', 400);
    }

    const existingMembership = await Membership.findOne({
      userId,
      groupId,
      status: 'active'
    }).session(session);

    if (existingMembership) {
      throw new AppError('Already a member of this group', 400);
    }

    const sharePrice = group.totalPrice / group.slotsTotal;
    let myShare = sharePrice;

    if (membershipType === 'temporary' && days) {
      myShare = (sharePrice / 30) * days;
    }

    if (user.creditBalance < myShare) {
      throw new AppError('Insufficient credit balance', 400);
    }

    user.creditBalance -= myShare;
    await user.save({ session });

    group.slotsFilled += 1;
    if (group.slotsFilled >= group.slotsTotal) {
      group.status = 'full';
    }
    await group.save({ session });

    const membership = await Membership.create([{
      userId,
      groupId,
      membershipType,
      myShare,
      nextPaymentDate: membershipType === 'monthly' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      endDate: membershipType === 'temporary' ? new Date(Date.now() + (days || 30) * 24 * 60 * 60 * 1000) : undefined,
      status: 'active',
      joinedAt: new Date(),
    }], { session });

    await Transaction.create([{
      userId,
      type: 'subscription_payment',
      amount: -myShare,
      description: `Joined ${group.name} - ${membershipType} membership`,
      status: 'completed',
      metadata: { groupId, membershipId: membership[0]._id },
    }], { session });

    await session.commitTransaction();

    res.status(200).json({
      message: 'Successfully joined the group',
      membership: membership[0],
      newBalance: user.creditBalance,
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(error.statusCode || 500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const leaveGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.userId;
    const { membershipId } = req.body;

    const membership = await Membership.findById(membershipId).session(session);
    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    if (membership.userId.toString() !== userId) {
      throw new AppError('Not authorized', 403);
    }

    if (membership.status !== 'active') {
      throw new AppError('Membership is not active', 400);
    }

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const group = await SubscriptionGroup.findById(membership.groupId).session(session);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    let refundAmount = 0;

    if (membership.membershipType === 'temporary' && membership.endDate) {
      const remainingDays = Math.ceil((membership.endDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      if (remainingDays > 0) {
        const dailyRate = membership.myShare / ((membership.endDate.getTime() - membership.joinedAt.getTime()) / (24 * 60 * 60 * 1000));
        refundAmount = dailyRate * remainingDays * 0.8;
      }
    }

    if (refundAmount > 0) {
      user.creditBalance += refundAmount;
      await user.save({ session });

      await Transaction.create([{
        userId,
        type: 'refund',
        amount: refundAmount,
        description: `Refund for leaving ${group.name}`,
        status: 'completed',
        metadata: { membershipId, groupId: group._id },
      }], { session });
    }

    membership.status = 'cancelled';
    await membership.save({ session });

    group.slotsFilled -= 1;
    if (group.status === 'full') {
      group.status = 'active';
    }
    await group.save({ session });

    await session.commitTransaction();

    res.status(200).json({
      message: 'Successfully left the group',
      refundAmount,
      newBalance: user.creditBalance,
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(error.statusCode || 500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
