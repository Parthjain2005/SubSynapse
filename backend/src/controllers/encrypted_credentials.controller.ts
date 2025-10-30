import { Request, Response } from 'express';
import {
  createEncryptedCredential,
  getEncryptedCredentialsByGroupId,
  getEncryptedCredentialById,
  updateEncryptedCredential,
  deleteEncryptedCredential,
} from '../services/encrypted_credentials.service';
import { createAuditLog } from '../services/audit.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const addEncryptedCredential = async (req: Request, res: Response) => {
  try {
    const credential = await createEncryptedCredential({ ...req.body });
    await createAuditLog(req.user!.userId, 'CREDENTIAL_CREATE', 'Encrypted_Credentials', undefined, JSON.stringify(credential));
    res.status(201).json(credential);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create credential' });
  }
};

export const getEncryptedCredentials = async (req: Request, res: Response) => {
  try {
    const credentials = await getEncryptedCredentialsByGroupId(parseInt(req.params.groupId, 10));
    res.json(credentials);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve credentials' });
  }
};

export const getEncryptedCredential = async (req: Request, res: Response) => {
    try {
        const credential = await getEncryptedCredentialById(parseInt(req.params.id, 10));
        res.json(credential);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve credential' });
    }
};

export const editEncryptedCredential = async (req: Request, res: Response) => {
    try {
        const oldCredential = await getEncryptedCredentialById(parseInt(req.params.id, 10));
        const credential = await updateEncryptedCredential(parseInt(req.params.id, 10), req.body);
        await createAuditLog(req.user!.userId, 'CREDENTIAL_UPDATE', 'Encrypted_Credentials', JSON.stringify(oldCredential), JSON.stringify(credential));
        res.json(credential);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update credential' });
    }
};

export const removeEncryptedCredential = async (req: Request, res: Response) => {
    try {
        const credential = await getEncryptedCredentialById(parseInt(req.params.id, 10));
        await deleteEncryptedCredential(parseInt(req.params.id, 10));
        await createAuditLog(req.user!.userId, 'CREDENTIAL_DELETE', 'Encrypted_Credentials', JSON.stringify(credential));
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete credential' });
    }
};
