import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';

const prisma = new PrismaClient();
const secret = process.env.ENCRYPTION_KEY!;

export const createEncryptedCredential = async (data: { group_id: number; encrypted_username: string; encrypted_password: string; encryption_key_id: string; }) => {
  const encryptedUsername = encrypt(data.encrypted_username, secret);
  const encryptedPassword = encrypt(data.encrypted_password, secret);

  return prisma.encrypted_Credentials.create({
    data: {
      ...data,
      encrypted_username: encryptedUsername,
      encrypted_password: encryptedPassword,
    },
  });
};

export const getEncryptedCredentialsByGroupId = async (group_id: number) => {
  const credentials = await prisma.encrypted_Credentials.findMany({
    where: { group_id },
  });

  return credentials.map(cred => ({
    ...cred,
    encrypted_username: decrypt(cred.encrypted_username, secret),
    encrypted_password: decrypt(cred.encrypted_password, secret),
  }));
};

export const getEncryptedCredentialById = async (id: number) => {
    const credential = await prisma.encrypted_Credentials.findUnique({
        where: { id },
    });

    if (!credential) {
        return null;
    }

    return {
        ...credential,
        encrypted_username: decrypt(credential.encrypted_username, secret),
        encrypted_password: decrypt(credential.encrypted_password, secret),
    };
};

export const updateEncryptedCredential = async (id: number, data: { encrypted_username?: string; encrypted_password?: string; }) => {
    const updateData: { encrypted_username?: string; encrypted_password?: string; } = {};

    if (data.encrypted_username) updateData.encrypted_username = encrypt(data.encrypted_username, secret);
    if (data.encrypted_password) updateData.encrypted_password = encrypt(data.encrypted_password, secret);

    return prisma.encrypted_Credentials.update({
        where: { id },
        data: updateData,
    });
};

export const deleteEncryptedCredential = async (id: number) => {
    return prisma.encrypted_Credentials.delete({
        where: { id },
    });
};
