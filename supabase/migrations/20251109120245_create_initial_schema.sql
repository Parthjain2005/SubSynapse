/*
  # Create SubSynapse Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `name` (text)
      - `avatar_url` (text)
      - `credit_balance` (integer, default 1000)
      - `member_since` (timestamptz, default now())
      - `role` (text, default 'user', check: 'user' or 'admin')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `subscription_groups`
      - `id` (uuid, primary key)
      - `name` (text)
      - `icon` (text)
      - `total_price` (numeric)
      - `slots_total` (integer)
      - `slots_filled` (integer, default 0)
      - `category` (text)
      - `tags` (text array)
      - `status` (text, default 'pending_review')
      - `credentials_username` (text)
      - `credentials_password` (text)
      - `proof` (text)
      - `owner_id` (uuid, references users)
      - `posted_by_name` (text)
      - `posted_by_rating` (numeric, default 5.0)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `memberships`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `group_id` (uuid, references subscription_groups)
      - `membership_type` (text: 'monthly' or 'temporary')
      - `my_share` (numeric)
      - `next_payment_date` (timestamptz)
      - `end_date` (timestamptz)
      - `status` (text, default 'active')
      - `joined_at` (timestamptz, default now())
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `transactions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `type` (text)
      - `amount` (numeric)
      - `description` (text)
      - `razorpay_order_id` (text)
      - `razorpay_payment_id` (text)
      - `status` (text, default 'completed')
      - `metadata` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `withdrawal_requests`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `amount` (numeric)
      - `upi_id` (text)
      - `status` (text, default 'pending')
      - `admin_notes` (text)
      - `requested_at` (timestamptz, default now())
      - `processed_at` (timestamptz)
      - `processed_by` (uuid, references users)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references users)
      - `razorpay_order_id` (text, unique)
      - `razorpay_payment_id` (text)
      - `razorpay_signature` (text)
      - `amount` (numeric)
      - `currency` (text, default 'INR')
      - `status` (text, default 'created')
      - `verified` (boolean, default false)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add admin-only policies for admin operations
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar_url text DEFAULT '',
  credit_balance integer DEFAULT 1000 CHECK (credit_balance >= 0),
  member_since timestamptz DEFAULT now(),
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscription_groups table
CREATE TABLE IF NOT EXISTS subscription_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text NOT NULL,
  total_price numeric NOT NULL CHECK (total_price >= 0),
  slots_total integer NOT NULL CHECK (slots_total >= 1),
  slots_filled integer DEFAULT 0 CHECK (slots_filled >= 0),
  category text NOT NULL,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'pending_review' CHECK (status IN ('active', 'pending_review', 'full', 'rejected')),
  credentials_username text NOT NULL,
  credentials_password text NOT NULL,
  proof text DEFAULT '',
  owner_id uuid REFERENCES users(id) ON DELETE CASCADE,
  posted_by_name text NOT NULL,
  posted_by_rating numeric DEFAULT 5.0 CHECK (posted_by_rating >= 0 AND posted_by_rating <= 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES subscription_groups(id) ON DELETE CASCADE,
  membership_type text NOT NULL CHECK (membership_type IN ('monthly', 'temporary')),
  my_share numeric NOT NULL CHECK (my_share >= 0),
  next_payment_date timestamptz,
  end_date timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  joined_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('credit_add', 'credit_deduct', 'subscription_payment', 'refund', 'withdrawal')),
  amount numeric NOT NULL,
  description text NOT NULL,
  razorpay_order_id text,
  razorpay_payment_id text,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create withdrawal_requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount >= 500),
  upi_id text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text DEFAULT '',
  requested_at timestamptz DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  razorpay_order_id text UNIQUE NOT NULL,
  razorpay_payment_id text,
  razorpay_signature text,
  amount numeric NOT NULL CHECK (amount >= 0),
  currency text DEFAULT 'INR',
  status text DEFAULT 'created' CHECK (status IN ('created', 'authorized', 'captured', 'failed')),
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscription_groups_status ON subscription_groups(status);
CREATE INDEX IF NOT EXISTS idx_subscription_groups_category ON subscription_groups(category);
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_group_id ON memberships(group_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON payments(razorpay_order_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Subscription groups policies
CREATE POLICY "Anyone can view active groups"
  ON subscription_groups FOR SELECT
  TO authenticated
  USING (status = 'active' OR owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
  ));

CREATE POLICY "Users can create groups"
  ON subscription_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own groups"
  ON subscription_groups FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own groups"
  ON subscription_groups FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can update any group"
  ON subscription_groups FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Memberships policies
CREATE POLICY "Users can view own memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create memberships"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own memberships"
  ON memberships FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Transactions policies
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Withdrawal requests policies
CREATE POLICY "Users can view own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Payments policies
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_groups_updated_at BEFORE UPDATE ON subscription_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_memberships_updated_at BEFORE UPDATE ON memberships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_withdrawal_requests_updated_at BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
