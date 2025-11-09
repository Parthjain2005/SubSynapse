import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../types/index.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { createRazorpayOrder, verifyRazorpaySignature, verifyWebhookSignature } from '../services/razorpayService.js';
import { AppError } from '../middleware/errorHandler.js';

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { amount } = req.body;

    if (!amount || amount < 100) {
      throw new AppError('Minimum amount is 100 credits', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const order = await createRazorpayOrder({
      amount,
      currency: 'INR',
      receipt: `order_${userId}_${Date.now()}`,
      notes: {
        userId: userId,
        purpose: 'credit_addition',
      },
    });

    const payment = await Payment.create({
      userId,
      razorpayOrderId: order.id,
      amount,
      currency: 'INR',
      status: 'created',
      verified: false,
    });

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.user?.userId;
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new AppError('Missing payment verification details', 400);
    }

    const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isValid) {
      throw new AppError('Invalid payment signature', 400);
    }

    const payment = await Payment.findOne({ razorpayOrderId }).session(session);
    if (!payment) {
      throw new AppError('Payment record not found', 404);
    }

    if (payment.verified) {
      throw new AppError('Payment already verified', 400);
    }

    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'captured';
    payment.verified = true;
    await payment.save({ session });

    const user = await User.findById(userId).session(session);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.creditBalance += payment.amount;
    await user.save({ session });

    await Transaction.create([{
      userId,
      type: 'credit_add',
      amount: payment.amount,
      description: `Added ${payment.amount} credits via Razorpay`,
      razorpayOrderId,
      razorpayPaymentId,
      status: 'completed',
    }], { session });

    await session.commitTransaction();

    res.status(200).json({
      message: 'Payment verified successfully',
      newBalance: user.creditBalance,
      amountAdded: payment.amount,
    });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(error.statusCode || 500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const handleWebhook = async (req: any, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = JSON.stringify(req.body);

    const isValid = verifyWebhookSignature(payload, signature);
    if (!isValid) {
      throw new AppError('Invalid webhook signature', 400);
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    if (event === 'payment.captured') {
      const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
      if (payment && !payment.verified) {
        payment.razorpayPaymentId = paymentEntity.id;
        payment.status = 'captured';
        payment.verified = true;
        await payment.save();
      }
    } else if (event === 'payment.failed') {
      const payment = await Payment.findOne({ razorpayOrderId: paymentEntity.order_id });
      if (payment) {
        payment.status = 'failed';
        await payment.save();
      }
    }

    res.status(200).json({ status: 'ok' });
  } catch (error: any) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const payments = await Payment.find({ userId, verified: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments({ userId, verified: true });

    res.status(200).json({
      payments,
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
