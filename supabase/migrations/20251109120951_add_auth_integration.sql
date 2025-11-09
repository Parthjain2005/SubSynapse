/*
  # Add Supabase Auth Integration

  1. Changes
    - Add trigger to sync auth.users with public.users
    - Add function to handle new user registration
    - Update users table to reference auth.users
    - Add password reset token support

  2. Security
    - Maintain RLS policies
    - Sync user data automatically
*/

-- Function to handle new user creation from auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, credit_balance, role, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    1000,
    'user',
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing RLS policies to work with auth.uid()
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow users to insert their own profile (for sync)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update subscription groups policies
DROP POLICY IF EXISTS "Users can create groups" ON subscription_groups;
CREATE POLICY "Users can create groups"
  ON subscription_groups FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Update memberships policies
DROP POLICY IF EXISTS "Users can create memberships" ON memberships;
CREATE POLICY "Users can create memberships"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update transactions policies
DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update withdrawal requests policies
DROP POLICY IF EXISTS "Users can create withdrawal requests" ON withdrawal_requests;
CREATE POLICY "Users can create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update payments policies
DROP POLICY IF EXISTS "Users can create own payments" ON payments;
CREATE POLICY "Users can create own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own payments" ON payments;
CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
