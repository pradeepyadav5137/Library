import mongoose from 'mongoose';
import Admin from './models/Admin.js';
import dotenv from 'dotenv';

dotenv.config();

const updateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/library');
    console.log('MongoDB connected');

    const email = '205124066@nitt.edu';
    const admin = await Admin.findOne({ email });

    if (!admin) {
      console.log(`Admin with email ${email} not found`);
      process.exit(1);
    }

    admin.role = 'superadmin';
    await admin.save();

    console.log(`Successfully updated role of ${email} to superadmin`);
    process.exit(0);
  } catch (error) {
    console.error('Error updating admin:', error);
    process.exit(1);
  }
};

updateAdmin();
