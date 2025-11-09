import { Router } from 'express';
import {
  getDashboard,
  getPendingGroups,
  approveGroup,
  rejectGroup,
  getAllWithdrawals,
  processWithdrawal,
  getAllUsers,
  getAllTransactions,
  getAnalytics,
} from '../controllers/adminController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.use(requireAdmin);

router.get('/dashboard', getDashboard);
router.get('/groups/pending', getPendingGroups);
router.put('/groups/:id/approve', approveGroup);
router.put('/groups/:id/reject', rejectGroup);
router.get('/withdrawals', getAllWithdrawals);
router.put('/withdrawals/:id/process', processWithdrawal);
router.get('/users', getAllUsers);
router.get('/transactions', getAllTransactions);
router.get('/analytics', getAnalytics);

export default router;
