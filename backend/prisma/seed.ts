import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password123', 12);

  const user1 = await prisma.user.create({
    data: {
      email: 'alice@prisma.io',
      name: 'Alice',
      password_hash: password,
      is_verified: true,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'bob@prisma.io',
      name: 'Bob',
      password_hash: password,
      is_verified: true,
    },
  });

  const group1 = await prisma.subscription_Groups.create({
    data: {
      owner_id: user1.id,
      name: 'Netflix Premium',
      service_type: 'Streaming',
      total_price: 15.99,
      slots_total: 4,
      slots_filled: 2,
    },
  });

  await prisma.group_Memberships.create({
    data: {
      user_id: user2.id,
      group_id: group1.id,
      share_amount: 3.99,
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
