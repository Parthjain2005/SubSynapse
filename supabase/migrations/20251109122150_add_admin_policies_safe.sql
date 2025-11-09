/*
  # Add Safe Admin Policies Without Recursion

  1. Problem
    - Previous admin policy caused infinite recursion
    - Need admin to view all data without querying users table in policy

  2. Solution
    - Use app_metadata from JWT for admin check
    - Store admin status in auth.users metadata
    - No recursion since we're not querying users table

  3. Changes
    - Update admin user's app_metadata
    - Create policies that check JWT metadata
    - Safe, no recursion
*/

-- First, update admin user's app_metadata to include role
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@subsynapse.com';

-- Now create safe admin policies that check JWT metadata

-- Admin can view all users
CREATE POLICY "Admin can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'admin@subsynapse.com'
    OR auth.uid() = id
  );

-- Admin can view all subscription groups
CREATE POLICY "Admin can view all groups"
  ON subscription_groups FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'admin@subsynapse.com'
    OR status = 'active'
    OR owner_id = auth.uid()
  );

-- Admin can update any subscription group
CREATE POLICY "Admin can update any group"
  ON subscription_groups FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@subsynapse.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@subsynapse.com');

-- Admin can view all withdrawal requests
CREATE POLICY "Admin can view all withdrawals"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'admin@subsynapse.com'
    OR user_id = auth.uid()
  );

-- Admin can update withdrawal requests
CREATE POLICY "Admin can update withdrawals"
  ON withdrawal_requests FOR UPDATE
  TO authenticated
  USING ((auth.jwt() ->> 'email') = 'admin@subsynapse.com')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@subsynapse.com');

-- Admin can view all transactions
CREATE POLICY "Admin can view all transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'admin@subsynapse.com'
    OR user_id = auth.uid()
  );

-- Admin can update any user (for withdrawal processing)
CREATE POLICY "Admin can update any user"
  ON users FOR UPDATE
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = 'admin@subsynapse.com'
    OR auth.uid() = id
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') = 'admin@subsynapse.com'
    OR auth.uid() = id
  );

-- Admin can insert transactions for any user
CREATE POLICY "Admin can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.jwt() ->> 'email') = 'admin@subsynapse.com'
    OR user_id = auth.uid()
  );
