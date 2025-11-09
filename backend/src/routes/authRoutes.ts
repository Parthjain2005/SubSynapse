import { Router } from 'express';
import { register, login, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { registerValidation, loginValidation, validateRequest } from '../middleware/validation.js';

const router = Router();

router.post('/register', registerValidation, validateRequest, register);
router.post('/login', loginValidation, validateRequest, login);
router.put('/change-password', authenticate, changePassword);

export default router;
