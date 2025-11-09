import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import SubscriptionGroup from '../models/SubscriptionGroup.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

export const getAllGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, category, sortBy = 'createdAt', page = 1, limit = 20 } = req.query;

    const query: any = { status: 'active' };

    if (search) {
      query.$text = { $search: search as string };
    }

    if (category && category !== 'all') {
      query.category = category;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const groups = await SubscriptionGroup.find(query)
      .sort({ [sortBy as string]: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await SubscriptionGroup.countDocuments(query);

    res.status(200).json({
      groups,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getGroupById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const group = await SubscriptionGroup.findById(id);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    res.status(200).json({ group });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const createGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { name, icon, totalPrice, slotsTotal, category, tags, credentials, proof } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const group = await SubscriptionGroup.create({
      name,
      icon,
      totalPrice,
      slotsTotal,
      slotsFilled: 0,
      category,
      tags: tags || [],
      status: 'pending_review',
      credentials,
      proof: proof || '',
      ownerId: userId,
      postedBy: {
        name: user.name,
        rating: 5.0,
      },
    });

    res.status(201).json({
      message: 'Group created successfully and pending admin approval',
      group,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const updateGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const updates = req.body;

    const group = await SubscriptionGroup.findById(id);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    if (group.ownerId.toString() !== userId) {
      throw new AppError('Not authorized to update this group', 403);
    }

    delete updates.ownerId;
    delete updates.status;
    delete updates.slotsFilled;

    Object.assign(group, updates);
    await group.save();

    res.status(200).json({
      message: 'Group updated successfully',
      group,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const deleteGroup = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const group = await SubscriptionGroup.findById(id);
    if (!group) {
      throw new AppError('Group not found', 404);
    }

    if (group.ownerId.toString() !== userId) {
      throw new AppError('Not authorized to delete this group', 403);
    }

    if (group.slotsFilled > 0) {
      throw new AppError('Cannot delete group with active members', 400);
    }

    await SubscriptionGroup.findByIdAndDelete(id);

    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getMyGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const groups = await SubscriptionGroup.find({ ownerId: userId }).sort({ createdAt: -1 });

    res.status(200).json({ groups });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};
