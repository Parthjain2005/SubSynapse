# SubSynapse Backend API

Complete backend system for SubSynapse with MongoDB, Razorpay payment integration, and JWT authentication.

## Features

- JWT-based authentication (register, login, password management)
- MongoDB database with Mongoose ODM
- Razorpay payment integration for credit purchases
- Subscription group management with admin approval
- Membership system with credit-based payments
- Wallet system with withdrawal requests
- Admin panel APIs for platform management
- Email notifications with Nodemailer
- Automated background jobs for membership expiry
- Comprehensive security (helmet, rate limiting, input validation)

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/subsynapse
# For MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/subsynapse

# JWT Configuration
JWT_SECRET=your_secure_random_secret_string_here
JWT_EXPIRE=7d

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email Configuration (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM=noreply@subsynapse.com

# Admin Configuration
ADMIN_EMAIL=admin@subsynapse.com
ADMIN_PASSWORD=SecureAdminPassword123!
ADMIN_NAME=Admin User
```

### 3. Setup MongoDB

**Option A: Local MongoDB**
- Install MongoDB from https://www.mongodb.com/try/download/community
- Start MongoDB service

**Option B: MongoDB Atlas (Recommended for Production)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster
3. Get your connection string
4. Update `MONGODB_URI` in `.env`

### 4. Setup Razorpay

1. Create Razorpay account at https://razorpay.com/
2. Go to Dashboard > Settings > API Keys
3. Generate API keys (Test mode for development)
4. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`
5. For webhooks, set webhook URL: `https://your-domain.com/api/payments/webhook`

### 5. Setup Email Service (Gmail)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to https://myaccount.google.com/security
   - Click on "App passwords"
   - Generate password for "Mail"
3. Update `EMAIL_USER` and `EMAIL_PASSWORD` in `.env`

### 6. Seed Database (Create Admin User)

```bash
npm run seed
```

This will create an admin user with the credentials from your `.env` file.

### 7. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### 8. Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `PUT /api/auth/change-password` - Change password

### User Management
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/transactions` - Get transaction history
- `GET /api/users/subscriptions` - Get active subscriptions
- `GET /api/users/dashboard-stats` - Get dashboard statistics

### Subscription Groups
- `GET /api/groups` - Get all active groups (with search/filter)
- `GET /api/groups/:id` - Get group by ID
- `POST /api/groups` - Create new group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `GET /api/groups/my-groups` - Get user's created groups

### Memberships
- `POST /api/memberships/join` - Join a group
- `POST /api/memberships/leave` - Leave a group

### Payments (Razorpay)
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify-payment` - Verify payment
- `POST /api/payments/webhook` - Razorpay webhook
- `GET /api/payments/history` - Get payment history

### Wallet
- `GET /api/wallet/balance` - Get credit balance
- `POST /api/wallet/withdraw` - Request withdrawal
- `GET /api/wallet/withdrawal-history` - Get withdrawal history

### Admin APIs (Require Admin Role)
- `GET /api/admin/dashboard` - Get admin dashboard stats
- `GET /api/admin/groups/pending` - Get pending group approvals
- `PUT /api/admin/groups/:id/approve` - Approve group
- `PUT /api/admin/groups/:id/reject` - Reject group
- `GET /api/admin/withdrawals` - Get all withdrawal requests
- `PUT /api/admin/withdrawals/:id/process` - Process withdrawal
- `GET /api/admin/users` - Get all users
- `GET /api/admin/transactions` - Get all transactions
- `GET /api/admin/analytics` - Get analytics data

### Health Check
- `GET /api/health` - Check API status

## Security Features

- Helmet.js for HTTP security headers
- Rate limiting on all endpoints
- Input validation and sanitization
- MongoDB injection prevention
- JWT token expiration
- Password strength validation
- CORS configuration
- Request size limiting

## Background Jobs

- Daily membership expiry check (runs at midnight)
- Automatic slot release when memberships expire
- Group status updates (active/full)

## Testing

Test the API using:
- Postman
- cURL
- Swagger UI (if implemented)

Example login request:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@subsynapse.com","password":"SecureAdminPassword123!"}'
```

## Deployment

### Heroku
```bash
heroku create subsynapse-api
heroku config:set MONGODB_URI=your_mongodb_uri
# Set all other env variables
git push heroku main
```

### Railway
1. Connect GitHub repository
2. Add environment variables in dashboard
3. Deploy automatically

### VPS/Cloud Server
1. Install Node.js and MongoDB
2. Clone repository
3. Set up environment variables
4. Use PM2 for process management
5. Set up Nginx as reverse proxy

## Troubleshooting

**MongoDB Connection Failed**
- Check if MongoDB is running
- Verify connection string
- Check network access (for Atlas)

**Razorpay Integration Issues**
- Verify API keys are correct
- Check if using test keys in development
- Ensure webhook signature is configured

**Email Not Sending**
- Verify Gmail app password
- Check if 2FA is enabled
- Try different SMTP service

## Support

For issues and questions, please check the documentation or create an issue in the repository.
