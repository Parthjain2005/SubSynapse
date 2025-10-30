import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/encryption';

const prisma = new PrismaClient();
const secret = process.env.ENCRYPTION_KEY!;

export const createSubscription = async (data: { name: string; url: string; username: string; password: string; userId: number; }) => {
  const encryptedUsername = encrypt(data.username, secret);
  const encryptedPassword = encrypt(data.password, secret);

  return prisma.subscription.create({
    data: {
      ...data,
      username: encryptedUsername,
      password: encryptedPassword,
    },
  });
};

export const getSubscriptionsByUserId = async (userId: number) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
  });

  return subscriptions.map(sub => ({
    ...sub,
    username: decrypt(sub.username, secret),
    password: decrypt(sub.password, secret),
  }));
};

export const getSubscriptionById = async (id: number) => {
    const subscription = await prisma.subscription.findUnique({
        where: { id },
    });

    if (!subscription) {
        return null;
    }

    return {
        ...subscription,
        username: decrypt(subscription.username, secret),
        password: decrypt(subscription.password, secret),
    };
};

export const updateSubscription = async (id: number, data: { name?: string; url?: string; username?: string; password?: string; }) => {
    const updateData: { name?: string; url?: string; username?: string; password?: string; } = {};

    if (data.name) updateData.name = data.name;
    if (data.url) updateData.url = data.url;
    if (data.username) updateData.username = encrypt(data.username, secret);
    if (data.password) updateData.password = encrypt(data.password, secret);

    return prisma.subscription.update({
        where: { id },
        data: updateData,
    });
};

export const deleteSubscription = async (id: number) => {
    return prisma.subscription.delete({
        where: { id },
    });
};
