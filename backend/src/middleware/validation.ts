import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  next();
};

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().notEmpty().withMessage('Name is required'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const createGroupValidation = [
  body('name').trim().notEmpty().withMessage('Group name is required'),
  body('icon').trim().notEmpty().withMessage('Icon is required'),
  body('totalPrice').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('slotsTotal').isInt({ min: 1 }).withMessage('Slots must be at least 1'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('credentials.username').trim().notEmpty().withMessage('Username is required'),
  body('credentials.password').trim().notEmpty().withMessage('Password is required'),
];

export const joinGroupValidation = [
  body('groupId').trim().notEmpty().withMessage('Group ID is required'),
  body('membershipType').isIn(['monthly', 'temporary']).withMessage('Invalid membership type'),
  body('days').optional().isInt({ min: 1 }).withMessage('Days must be at least 1'),
];

export const withdrawalValidation = [
  body('amount').isFloat({ min: 500 }).withMessage('Minimum withdrawal is 500 credits'),
  body('upiId').trim().notEmpty().withMessage('UPI ID is required'),
];
