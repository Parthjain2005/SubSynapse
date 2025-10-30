import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createAuditLog = async (action: string, userId: number, details?: string) => {
  return prisma.auditLog.create({
    data: {
      action,
      userId,
      details,
    },
  });
};
