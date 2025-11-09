import mongoose, { Schema, Model } from 'mongoose';
import { ISubscriptionGroup } from '../types/index.js';

const subscriptionGroupSchema = new Schema<ISubscriptionGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    slotsTotal: {
      type: Number,
      required: true,
      min: 1,
    },
    slotsFilled: {
      type: Number,
      default: 0,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ['active', 'pending_review', 'full', 'rejected'],
      default: 'pending_review',
    },
    credentials: {
      username: {
        type: String,
        required: true,
      },
      password: {
        type: String,
        required: true,
      },
    },
    proof: {
      type: String,
      default: '',
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    postedBy: {
      name: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        default: 5.0,
        min: 0,
        max: 5,
      },
    },
  },
  {
    timestamps: true,
  }
);

subscriptionGroupSchema.index({ status: 1, category: 1 });
subscriptionGroupSchema.index({ name: 'text', tags: 'text' });

const SubscriptionGroup: Model<ISubscriptionGroup> = mongoose.model<ISubscriptionGroup>(
  'SubscriptionGroup',
  subscriptionGroupSchema
);

export default SubscriptionGroup;
