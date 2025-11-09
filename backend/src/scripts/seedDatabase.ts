import dotenv from 'dotenv';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import User from '../models/User.js';
import { hashPassword } from '../utils/password.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    console.log('🌱 Seeding database...');

    await connectDatabase();

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@subsynapse.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const adminName = process.env.ADMIN_NAME || 'Admin User';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      await disconnectDatabase();
      return;
    }

    const passwordHash = await hashPassword(adminPassword);

    const admin = await User.create({
      email: adminEmail,
      passwordHash,
      name: adminName,
      creditBalance: 100000,
      memberSince: new Date(),
      role: 'admin',
    });

    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('⚠️  Please change the admin password after first login!');

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedAdmin();
