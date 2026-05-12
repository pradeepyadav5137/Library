# NITT ID Card Re-issue – Setup

Official-style portal: Apply as Student, Faculty/Staff, or Admin login. OTP verification via institute webmail (@nitt.edu), payment instructions (SBI Collect), and AWS S3 Storage for documents.

## Project Structure

```
backend/   → Express + MongoDB API (nodemailer OTP, optional AWS S3 Storage)
frontend/  → React + Vite frontend
```

## Home page options

1. **Apply as Student** – Roll number → OTP to rollno@nitt.edu → 4 steps: Verification, Fill form + photo, Payment & docs (FIR + SBI receipt), Preview → Submit & download PDF.
2. **Apply as Faculty/Staff** – Institute webmail (@nitt.edu) → OTP → Fill form (no docs) → Preview → Submit & download PDF.
3. **Admin Login** – No registration; forgot password via OTP to admin email. After login: add new admin, view/verify applications, download documents (local or Firebase URLs).

## 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

- **MONGODB_URI** – MongoDB connection string.
- **JWT_SECRET** – Long random secret for tokens.
- **NODEMAILER_USER**, **NODEMAILER_PASSWORD** – SMTP credentials (OTP to rollno@nitt.edu and institute webmail).
- **Firebase (optional)** – Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` (minified service account JSON) and optionally `FIREBASE_STORAGE_BUCKET`. If not set, files are stored in `./uploads`.

First admin: no public registration. Create manually or run:

```bash
node scripts/seedAdmin.js
```

(Requires ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD in `.env`.)

Start API:

```bash
npm start
```

API base: `http://localhost:5000/api`.

## 2. Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env` (or `.env.local`):

```env
VITE_API_URL=http://localhost:5000/api
VITE_API_BASE=http://localhost:5000
```

Start app:

```bash
npm run dev
```

## 3. Main API endpoints

- **Auth:** `POST /api/auth/send-otp` (body: `rollNo` + `userType: 'student'` or `email` + `userType: 'faculty'|'staff'`), `POST /api/auth/verify-email`, `POST /api/auth/admin-login`, `POST /api/auth/admin-forgot-password`, `POST /api/auth/admin-reset-password`.
- **Applications:** `POST /api/applications/submit` (Bearer applicant token, multipart: form + photo, fir, payment), `GET /api/applications/status/:id`, `GET /api/applications/all` (admin only).
- **Admin:** `GET /api/admin/stats`, `PUT /api/admin/approve/:id`, `PUT /api/admin/reject/:id`, `POST /api/admin/add` (add new admin).

Once `.env` is set and both servers run, the app is ready to use.







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

