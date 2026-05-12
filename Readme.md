# 🚀 NITT ID Card Re-issue - Production Setup Guide

Follow these steps to configure, install dependencies, and run the complete MERN stack application locally.

## 1. Prerequisites
Ensure you have the following installed:
*   Node.js (v18 or higher recommended)
*   MongoDB (running locally or a cloud Atlas connection)

---

## 2. Environment Variables (.env Setup)

You need to create the .env configuration file in the backend directory. We have provided an example file.

cd backend
cp ../.env.example .env


Open backend/.env and configure the following variables:

# MongoDB Connection String (Replace with your Atlas URL if not local)
MONGODB_URI=mongodb://localhost:27017/nitt_id_dev

# JWT Secret (Use a strong random string)
JWT_SECRET=supersecretlongstring

# AWS SES Config (For sending emails)
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
SES_FROM_EMAIL=noreply@nitt.edu

# AWS S3 Config (Optional - For storing uploads directly in S3)
S3_BUCKET_NAME=nitt-id-bucket

# Application Ports & URLs
PORT=5000
FRONTEND_URL=http://localhost:5173
ADMIN_URL=http://localhost:5173/admin/dashboard

# First Admin Seed Config (For running seedAdmin script)
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@nitt.edu
ADMIN_PASSWORD=admin123


---

## 3. Install Dependencies

You need to install packages for both the backend and frontend.

**Install Backend Dependencies:**
From the root of the project:
npm install --prefix backend


**Install Frontend Dependencies:**
From the root of the project:
npm install --prefix frontend


---

## 4. Run the Application

The system requires two terminal windows to run both servers concurrently.

### Terminal 1: Start Backend Server
This will start the Express API on port 5000.

cd backend
npm run dev &


(Optional: If you need to create the initial admin user, run node backend/scripts/seedAdmin.js while the backend directory is your working directory)

### Terminal 2: Start Frontend Application
This will start the Vite React application, usually on port 5173.

cd frontend
npm run dev &


---

## ✅ You're Done!
*   **Public Portal:** Visit http://localhost:5173
*   **Admin Dashboard:** Visit http://localhost:5173/admin-login
