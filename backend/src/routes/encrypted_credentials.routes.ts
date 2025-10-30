import { Router } from 'express';
import {
  addEncryptedCredential,
  getEncryptedCredentials,
  getEncryptedCredential,
  editEncryptedCredential,
  removeEncryptedCredential,
} from '../controllers/encrypted_credentials.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authMiddleware, addEncryptedCredential);
router.get('/group/:groupId', authMiddleware, getEncryptedCredentials);
router.get('/:id', authMiddleware, getEncryptedCredential);
router.put('/:id', authMiddleware, editEncryptedCredential);
router.delete('/:id', authMiddleware, removeEncryptedCredential);

export default router;
