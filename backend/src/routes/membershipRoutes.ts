import { Router } from 'express';
import { joinGroup, leaveGroup } from '../controllers/membershipController.js';
import { authenticate } from '../middleware/auth.js';
import { joinGroupValidation, validateRequest } from '../middleware/validation.js';

const router = Router();

router.post('/join', authenticate, joinGroupValidation, validateRequest, joinGroup);
router.post('/leave', authenticate, leaveGroup);

export default router;
