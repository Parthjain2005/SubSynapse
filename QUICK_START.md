# SubSynapse Quick Start Guide

## Prerequisites
- Node.js (v18 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Razorpay account (for payment integration)
- Gmail account (for email notifications)

## Step 1: Backend Setup

### 1.1 Install Backend Dependencies
```bash
cd backend
npm install
```

### 1.2 Create Backend .env File
Create `backend/.env` with the following:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB (choose one option)
# Option A: Local MongoDB
MONGODB_URI=mongodb://localhost:27017/subsynapse

# Option B: MongoDB Atlas (recommended)
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/subsynapse

# JWT Configuration
JWT_SECRET=change_this_to_a_random_secret_string
JWT_EXPIRE=7d

# Razorpay (Get from https://dashboard.razorpay.com/)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email (Gmail App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@subsynapse.com

# Admin User
ADMIN_EMAIL=admin@subsynapse.com
ADMIN_PASSWORD=Admin@12345
ADMIN_NAME=Admin User
```

### 1.3 Get Required API Keys

**Razorpay:**
1. Sign up at https://razorpay.com/
2. Go to Settings → API Keys
3. Generate Test Keys
4. Copy Key ID and Secret to .env

**Gmail App Password:**
1. Enable 2-Factor Authentication on Gmail
2. Go to https://myaccount.google.com/apppasswords
3. Generate app password for "Mail"
4. Copy password to .env

**MongoDB Atlas (if not using local):**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Update MONGODB_URI in .env

### 1.4 Seed Database
```bash
npm run seed
```
This creates the admin user.

### 1.5 Start Backend
```bash
npm run dev
```
Backend will run on http://localhost:5000

## Step 2: Frontend Setup

### 2.1 Create Frontend .env File
Create `.env` in project root:

```env
VITE_API_URL=http://localhost:5000/api
```

### 2.2 Start Frontend
```bash
npm run dev
```
Frontend will run on http://localhost:5173

## Step 3: Test the Application

### 3.1 Test User Registration
1. Open http://localhost:5173
2. Click "Sign up"
3. Register with email and password (min 8 chars, uppercase, lowercase, number)
4. You'll get 1000 free credits

### 3.2 Test Payment Integration
1. Login to your account
2. Click "Add Credits"
3. Select amount (e.g., 500)
4. Click "Pay"
5. Use Razorpay test card:
   - Card: 4111 1111 1111 1111
   - CVV: Any 3 digits
   - Expiry: Any future date
6. Complete payment
7. Credits should be added automatically

### 3.3 Test Group Joining
1. Browse subscription groups
2. Click "Join Group"
3. Select membership type
4. Confirm payment
5. View credentials in "My Subscriptions"

### 3.4 Test Admin Panel
1. Logout from user account
2. Login with admin credentials:
   - Email: admin@subsynapse.com
   - Password: Admin@12345 (or your custom password)
3. Admin should see pending groups to approve
4. Approve a group
5. Check withdrawal requests

## API Testing with cURL

### Test Health Check
```bash
curl http://localhost:5000/api/health
```

### Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test@12345"}'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test@12345"}'
```

## Troubleshooting

### Backend won't start
- Check if MongoDB is running (local) or connection string is correct (Atlas)
- Verify all environment variables are set
- Check if port 5000 is already in use

### Payment not working
- Ensure Razorpay keys are correct
- Use test mode keys for development
- Check Razorpay dashboard for payment logs

### Emails not sending
- Verify Gmail app password is correct
- Check if 2FA is enabled on Gmail account
- Try a different SMTP service if needed

### Frontend can't connect to backend
- Check if backend is running on port 5000
- Verify VITE_API_URL in frontend .env
- Check browser console for CORS errors

## Production Deployment Checklist

### Before Going Live:
- [ ] Switch to MongoDB Atlas (not local)
- [ ] Switch Razorpay to Live mode (complete KYC)
- [ ] Change all passwords and secrets
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS
- [ ] Configure proper CORS origins
- [ ] Set up monitoring and logging
- [ ] Test all payment flows in production mode
- [ ] Set up automatic database backups

## Need Help?

Refer to:
- `backend/README.md` - Detailed backend documentation
- `IMPLEMENTATION_SUMMARY.md` - Complete implementation details
- Backend logs for error messages
- Razorpay dashboard for payment issues

## Project Structure

```
project/
├── backend/                    # Backend API
│   ├── src/
│   │   ├── config/            # Database config
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # Auth, validation
│   │   ├── models/            # Mongoose models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Email, Razorpay
│   │   ├── utils/             # JWT, password
│   │   └── server.ts          # Main server
│   ├── package.json
│   └── .env                   # Backend config
├── services/                   # Frontend API service
│   └── api.ts                 # Backend integration
├── components/                 # React components
│   └── AddCreditsModal.tsx    # Razorpay integration
├── .env                       # Frontend config
└── package.json
```

## Default Admin Credentials

**Email**: admin@subsynapse.com
**Password**: Admin@12345 (or your custom password from .env)

⚠️ **IMPORTANT**: Change admin password after first login!

## Test Razorpay Cards

**Successful Payment:**
- Card: 4111 1111 1111 1111
- CVV: 123
- Expiry: 12/25

**Failed Payment:**
- Card: 4000 0000 0000 0002

More test cards: https://razorpay.com/docs/payments/payments/test-card-details/

---

**You're all set!** The backend is fully functional with MongoDB, Razorpay, and all features implemented. 🚀
