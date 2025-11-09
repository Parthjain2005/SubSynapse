import { Router } from 'express';
import { getAllGroups, getGroupById, createGroup, updateGroup, deleteGroup, getMyGroups } from '../controllers/groupController.js';
import { authenticate } from '../middleware/auth.js';
import { createGroupValidation, validateRequest } from '../middleware/validation.js';

const router = Router();

router.get('/', getAllGroups);
router.get('/my-groups', authenticate, getMyGroups);
router.get('/:id', getGroupById);
router.post('/', authenticate, createGroupValidation, validateRequest, createGroup);
router.put('/:id', authenticate, updateGroup);
router.delete('/:id', authenticate, deleteGroup);

export default router;
