import cron from 'node-cron';
import Membership from '../models/Membership.js';
import SubscriptionGroup from '../models/SubscriptionGroup.js';

export const startCronJobs = () => {
  cron.schedule('0 0 * * *', async () => {
    console.log('🔄 Running daily membership expiry check...');

    try {
      const now = new Date();

      const expiredMemberships = await Membership.find({
        status: 'active',
        membershipType: 'temporary',
        endDate: { $lte: now },
      });

      for (const membership of expiredMemberships) {
        membership.status = 'expired';
        await membership.save();

        const group = await SubscriptionGroup.findById(membership.groupId);
        if (group) {
          group.slotsFilled = Math.max(0, group.slotsFilled - 1);
          if (group.status === 'full') {
            group.status = 'active';
          }
          await group.save();
        }
      }

      console.log(`✅ Expired ${expiredMemberships.length} memberships`);
    } catch (error) {
      console.error('❌ Error in membership expiry job:', error);
    }
  });

  console.log('⏰ Cron jobs started');
};
