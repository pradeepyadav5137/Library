import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Admin from '../models/Admin.js';

dotenv.config();

async function seed() {
  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !email || !password) {
    console.log('Set ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD in .env to create first admin.');
    process.exit(0);
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const exists = await Admin.findOne({ $or: [{ username }, { email: email.toLowerCase() }] });
    if (exists) {
      console.log('Admin already exists.');
      process.exit(0);
      return;
    }
    const admin = new Admin({ username, email: email.trim().toLowerCase(), password, role: 'admin' });
    await admin.save();
    console.log('First admin created successfully.');
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
