import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const createAuditLog = async (
  user_id: number,
  action: string,
  table_name: string,
  old_values?: string,
  new_values?: string,
  ip_address?: string
) => {
  return prisma.audit_Logs.create({
    data: {
      user_id,
      action,
      table_name,
      old_values,
      new_values,
      ip_address,
    },
  });
};
