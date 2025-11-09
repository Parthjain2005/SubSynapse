# SubSynapse Quick Start Guide (Supabase)

## You're Ready to Go! 🚀

SubSynapse is now using **Supabase** and is ready to use immediately. The database has been created with all tables, RLS policies, an admin user, and sample data.

## What's Already Set Up

✅ **Database**: 6 tables created in Supabase PostgreSQL
✅ **Security**: Row Level Security (RLS) enabled on all tables
✅ **Admin User**: Created with 100,000 credits
✅ **Sample Data**: 3 subscription groups (Netflix, Spotify, ChatGPT)
✅ **Frontend**: Integrated with Supabase client
✅ **Build**: Project builds successfully

## Start the Application

```bash
npm run dev
```

The app will open at: **http://localhost:5173**

## Test User Accounts

### Admin Account
- **Email**: admin@subsynapse.com
- **Role**: Admin
- **Credits**: 100,000
- **Can**: Approve groups, process withdrawals

### Create New User
1. Click "Sign up"
2. Enter name, email, and password
3. Get 1000 free credits automatically

**Note**: Password validation is simplified - use any password for testing.

## Quick Test Flow

### 1. Register & Login
```
1. Register new user
2. Receive 1000 credits
3. See homepage with subscription groups
```

### 2. Browse Groups
```
- Netflix Premium (649/month, 4 slots)
- Spotify Family (179/month, 6 slots)
- ChatGPT Plus (2000/month, 5 slots)
```

### 3. Join a Group
```
1. Click "Join Group" on Netflix
2. Select "Monthly" membership
3. Confirm payment
4. Credits deducted: 1000 - 162 = 838
5. View credentials in "My Subscriptions"
```

### 4. Add Credits
```
1. Click "Add Credits"
2. Select 500
3. Click "Add Credits"
4. Balance: 838 + 500 = 1338
```

### 5. Leave a Group
```
1. Go to "My Subscriptions"
2. Click "Leave" on Netflix
3. Get refund if applicable
4. Membership cancelled
```

### 6. Create New Group
```
1. Click "Create Group"
2. Fill details:
   - Name: "Disney+ Hotstar"
   - Price: 299
   - Slots: 4
   - Category: Entertainment
   - Credentials
3. Submit
4. Status: pending_review
5. Admin must approve
```

### 7. Request Withdrawal
```
1. Go to Profile
2. Click "Withdraw Credits"
3. Enter amount (min 500)
4. Enter UPI ID
5. Submit request
6. Status: pending
7. Admin must approve
```

## Admin Functions (Login as Admin)

```
Email: admin@subsynapse.com
Password: anything
```

**Admin Can:**
- View all pending group submissions
- Approve or reject groups
- View all withdrawal requests
- Approve withdrawals (deducts credits)
- Reject withdrawals (no deduction)
- View all users and transactions

**Note**: Admin panel UI needs to be built. Backend data is ready.

## Database Access

You can view and modify data directly in Supabase:

1. Go to your Supabase project dashboard
2. Click "Table Editor"
3. View/edit:
   - users
   - subscription_groups
   - memberships
   - transactions
   - withdrawal_requests
   - payments

## Useful SQL Queries

### Check User Balance
```sql
SELECT name, email, credit_balance
FROM users
WHERE email = 'your@email.com';
```

### View All Active Groups
```sql
SELECT name, total_price, slots_total, slots_filled
FROM subscription_groups
WHERE status = 'active';
```

### View User's Subscriptions
```sql
SELECT
  u.name as user_name,
  sg.name as group_name,
  m.my_share as cost,
  m.status
FROM memberships m
JOIN users u ON m.user_id = u.id
JOIN subscription_groups sg ON m.group_id = sg.id
WHERE u.email = 'your@email.com';
```

### View Pending Approvals
```sql
SELECT name, owner_id, status
FROM subscription_groups
WHERE status = 'pending_review';
```

### View All Transactions
```sql
SELECT
  u.name,
  t.type,
  t.amount,
  t.description,
  t.created_at
FROM transactions t
JOIN users u ON t.user_id = u.id
ORDER BY t.created_at DESC;
```

## Architecture

```
┌─────────────┐
│   Frontend  │ (React + Vite)
│  (Browser)  │
└──────┬──────┘
       │
       │ Supabase Client
       │ (Direct Connection)
       │
┌──────▼──────┐
│  Supabase   │
│ PostgreSQL  │
│   + RLS     │
└─────────────┘
```

**No Backend Server Required!**
- Direct client-to-database communication
- RLS enforces security at database level
- Automatic API generation
- Real-time capabilities available

## Features Working

✅ User registration & login
✅ Browse subscription groups
✅ Join groups with credit deduction
✅ Leave groups with refund
✅ View credentials for active subscriptions
✅ Add credits to wallet
✅ Request withdrawals
✅ Create new groups
✅ Transaction history
✅ Group slot management
✅ Admin user creation

## Features Not Yet Implemented

⚠️ **Password Hashing**
Currently no password validation. For production, integrate Supabase Auth.

⚠️ **Razorpay Payments**
Payment gateway requires backend or Edge Functions.

⚠️ **Email Notifications**
Email sending requires Edge Functions or external service.

⚠️ **Admin Panel UI**
Backend data ready, but admin pages need to be built.

⚠️ **Real JWT Authentication**
Using simple mock tokens. Integrate Supabase Auth for production.

## Next Steps for Production

1. **Enable Supabase Auth**
   - Replace mock authentication
   - Add proper JWT tokens
   - Enable password hashing
   - Add email verification

2. **Create Edge Functions**
   - Payment processing with Razorpay
   - Email notifications
   - Background jobs (cron)

3. **Build Admin Panel**
   - Group approval interface
   - Withdrawal processing
   - User management
   - Analytics dashboard

4. **Add Security**
   - Input validation
   - Rate limiting
   - Audit logging
   - 2FA for admins

## Troubleshooting

### Can't see any groups?
- Check if sample data was inserted
- Run SQL: `SELECT * FROM subscription_groups WHERE status = 'active'`
- Verify RLS policies allow reading

### Login not working?
- Currently accepts any password
- Check if user exists in database
- Verify email is correct

### Credits not deducting?
- Check RLS policies allow updates
- Verify sufficient balance
- Check browser console for errors

### Build errors?
- Run `npm install`
- Clear node_modules and reinstall
- Check Supabase URL and anon key in .env

## Environment Variables

Already configured in `.env`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Support

- Check `SUPABASE_IMPLEMENTATION.md` for detailed docs
- View Supabase logs in dashboard
- Test SQL queries in Supabase SQL Editor
- Check browser console for frontend errors

---

**Everything is ready!** Just run `npm run dev` and start testing. 🎉

The database is live, RLS is active, and all core features are functional. You can now:
- Register users
- Join/leave groups
- Manage credits
- Create groups
- Request withdrawals

Have fun testing SubSynapse! 🚀
