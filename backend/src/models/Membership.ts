import mongoose, { Schema, Model } from 'mongoose';
import { IMembership } from '../types/index.js';

const membershipSchema = new Schema<IMembership>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'SubscriptionGroup',
      required: true,
    },
    membershipType: {
      type: String,
      enum: ['monthly', 'temporary'],
      required: true,
    },
    myShare: {
      type: Number,
      required: true,
      min: 0,
    },
    nextPaymentDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled'],
      default: 'active',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

membershipSchema.index({ userId: 1, status: 1 });
membershipSchema.index({ groupId: 1 });

const Membership: Model<IMembership> = mongoose.model<IMembership>('Membership', membershipSchema);

export default Membership;
