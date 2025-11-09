import mongoose, { Schema, Model } from 'mongoose';
import { IWithdrawalRequest } from '../types/index.js';

const withdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 500,
    },
    upiId: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

withdrawalRequestSchema.index({ userId: 1, status: 1 });

const WithdrawalRequest: Model<IWithdrawalRequest> = mongoose.model<IWithdrawalRequest>(
  'WithdrawalRequest',
  withdrawalRequestSchema
);

export default WithdrawalRequest;
