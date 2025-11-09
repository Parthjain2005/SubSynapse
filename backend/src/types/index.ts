import { Request } from 'express';
import { Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  avatarUrl?: string;
  creditBalance: number;
  memberSince: Date;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionGroup {
  _id: Types.ObjectId;
  name: string;
  icon: string;
  totalPrice: number;
  slotsTotal: number;
  slotsFilled: number;
  category: string;
  tags: string[];
  status: 'active' | 'pending_review' | 'full' | 'rejected';
  credentials: {
    username: string;
    password: string;
  };
  proof?: string;
  ownerId: Types.ObjectId;
  postedBy: {
    name: string;
    rating: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IMembership {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  groupId: Types.ObjectId;
  membershipType: 'monthly' | 'temporary';
  myShare: number;
  nextPaymentDate?: Date;
  endDate?: Date;
  status: 'active' | 'expired' | 'cancelled';
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITransaction {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: 'credit_add' | 'credit_deduct' | 'subscription_payment' | 'refund' | 'withdrawal';
  amount: number;
  description: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: 'pending' | 'completed' | 'failed';
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWithdrawalRequest {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  upiId: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  requestedAt: Date;
  processedAt?: Date;
  processedBy?: Types.ObjectId;
}

export interface IPayment {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'failed';
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'user' | 'admin';
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}
