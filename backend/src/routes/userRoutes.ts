import { Router } from 'express';
import { getProfile, updateProfile, getTransactions, getMySubscriptions, getDashboardStats } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/me', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.get('/transactions', authenticate, getTransactions);
router.get('/subscriptions', authenticate, getMySubscriptions);
router.get('/dashboard-stats', authenticate, getDashboardStats);

export default router;
