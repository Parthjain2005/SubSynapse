import { Request, Response } from 'express';
import {
  createSubscription,
  getSubscriptionsByUserId,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription,
} from '../services/subscription.service';
import { createAuditLog } from '../services/audit.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const addSubscription = async (req: Request, res: Response) => {
  try {
    const subscription = await createSubscription({ ...req.body, userId: req.user!.userId });
    await createAuditLog('SUBSCRIPTION_CREATE', req.user!.userId, `Created subscription ${subscription.name}.`);
    res.status(201).json(subscription);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const subscriptions = await getSubscriptionsByUserId(req.user!.userId);
    res.json(subscriptions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve subscriptions' });
  }
};

export const getSubscription = async (req: Request, res: Response) => {
    try {
        const subscription = await getSubscriptionById(parseInt(req.params.id, 10));
        if (subscription && subscription.userId === req.user!.userId) {
            res.json(subscription);
        } else {
            res.status(404).json({ error: 'Subscription not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve subscription' });
    }
};

export const editSubscription = async (req: Request, res: Response) => {
    try {
        const subscription = await getSubscriptionById(parseInt(req.params.id, 10));
        if (subscription && subscription.userId === req.user!.userId) {
            const updatedSubscription = await updateSubscription(parseInt(req.params.id, 10), req.body);
            await createAuditLog('SUBSCRIPTION_UPDATE', req.user!.userId, `Updated subscription ${updatedSubscription.name}.`);
            res.json(updatedSubscription);
        } else {
            res.status(404).json({ error: 'Subscription not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update subscription' });
    }
};

export const removeSubscription = async (req: Request, res: Response) => {
    try {
        const subscription = await getSubscriptionById(parseInt(req.params.id, 10));
        if (subscription && subscription.userId === req.user!.userId) {
            await deleteSubscription(parseInt(req.params.id, 10));
            await createAuditLog('SUBSCRIPTION_DELETE', req.user!.userId, `Deleted subscription with id ${req.params.id}.`);
            res.status(204).send();
        } else {
            res.status(404).json({ error: 'Subscription not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete subscription' });
    }
};
