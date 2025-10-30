import { Router } from 'express';
import {
  addSubscription,
  getSubscriptions,
  getSubscription,
  editSubscription,
  removeSubscription,
} from '../controllers/subscription.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, addSubscription);
router.get('/user/:userId', authMiddleware, getSubscriptions);
router.get('/:id', authMiddleware, getSubscription);
router.put('/:id', authMiddleware, editSubscription);
router.delete('/:id', authMiddleware, removeSubscription);

export default router;
