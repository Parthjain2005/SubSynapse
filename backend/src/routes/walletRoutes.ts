import { Router } from 'express';
import { getBalance, requestWithdrawal, getWithdrawalHistory } from '../controllers/walletController.js';
import { authenticate } from '../middleware/auth.js';
import { withdrawalValidation, validateRequest } from '../middleware/validation.js';

const router = Router();

router.get('/balance', authenticate, getBalance);
router.post('/withdraw', authenticate, withdrawalValidation, validateRequest, requestWithdrawal);
router.get('/withdrawal-history', authenticate, getWithdrawalHistory);

export default router;
