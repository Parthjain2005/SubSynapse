/*
  # Fix Security Issues - Part 2: Optimize RLS Policies

  1. Problems
    - Auth functions called without SELECT wrapper causes re-evaluation for each row
    - Multiple duplicate/overlapping policies on same tables
    - Unused indexes taking up space

  2. Solution
    - Wrap all auth.uid() and auth.jwt() calls with SELECT
    - Remove duplicate policies, keep consolidated ones
    - Drop unused indexes (they can be recreated if needed later)

  3. Changes
    - Drop all existing policies
    - Recreate with optimized (SELECT auth.function()) pattern
    - Remove duplicate admin policies
    - Drop unused indexes
*/

-- ============================================================================
-- STEP 1: Drop all existing policies
-- ============================================================================

-- Users table
DROP POLICY IF EXISTS "Admin can view all users" ON users;
DROP POLICY IF EXISTS "Admin can update any user" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view profiles" ON users;
DROP POLICY IF EXISTS "Users can update profiles" ON users;

-- Subscription groups
DROP POLICY IF EXISTS "Admin can view all groups" ON subscription_groups;
DROP POLICY IF EXISTS "Admin can update any group" ON subscription_groups;
DROP POLICY IF EXISTS "Admins can update any group" ON subscription_groups;
DROP POLICY IF EXISTS "Anyone can view active groups" ON subscription_groups;
DROP POLICY IF EXISTS "Owners can update own groups" ON subscription_groups;
DROP POLICY IF EXISTS "Owners can delete own groups" ON subscription_groups;
DROP POLICY IF EXISTS "Users can create groups" ON subscription_groups;
DROP POLICY IF EXISTS "View subscription groups" ON subscription_groups;
DROP POLICY IF EXISTS "Create subscription groups" ON subscription_groups;
DROP POLICY IF EXISTS "Update subscription groups" ON subscription_groups;
DROP POLICY IF EXISTS "Delete subscription groups" ON subscription_groups;

-- Memberships
DROP POLICY IF EXISTS "Admins can view all memberships" ON memberships;
DROP POLICY IF EXISTS "Users can view own memberships" ON memberships;
DROP POLICY IF EXISTS "Users can create memberships" ON memberships;
DROP POLICY IF EXISTS "Users can update own memberships" ON memberships;
DROP POLICY IF EXISTS "View memberships" ON memberships;
DROP POLICY IF EXISTS "Create memberships" ON memberships;
DROP POLICY IF EXISTS "Update memberships" ON memberships;

-- Transactions
DROP POLICY IF EXISTS "Admin can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON transactions;
DROP POLICY IF EXISTS "Admin can create transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
DROP POLICY IF EXISTS "View transactions" ON transactions;
DROP POLICY IF EXISTS "Create transactions" ON transactions;

-- Withdrawal requests
DROP POLICY IF EXISTS "Admin can view all withdrawals" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admin can update withdrawals" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Users can create withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "View withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Create withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Update withdrawal requests" ON withdrawal_requests;

-- Payments
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can create own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;
DROP POLICY IF EXISTS "View payments" ON payments;
DROP POLICY IF EXISTS "Create payments" ON payments;
DROP POLICY IF EXISTS "Update payments" ON payments;

-- ============================================================================
-- STEP 2: Create optimized policies with SELECT wrapper
-- ============================================================================

-- USERS TABLE POLICIES
CREATE POLICY "Users can view profiles"
  ON users FOR SELECT
  TO authenticated
  USING (
    ((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com'
    OR (SELECT auth.uid()) = id
  );

CREATE POLICY "Users can update profiles"
  ON users FOR UPDATE
  TO authenticated
  USING (
    ((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com'
    OR (SELECT auth.uid()) = id
  )
  WITH CHECK (
    ((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com'
    OR (SELECT auth.uid()) = id
  );

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id);

-- SUBSCRIPTION GROUPS POLICIES
CREATE POLICY "View subscription groups"
  ON subscription_groups FOR SELECT
  TO authenticated
  USING (
    ((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com'
    OR status = 'active'
    OR owner_id = (SELECT auth.uid())
  );

CREATE POLICY "Create subscription groups"
  ON subscription_groups FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (SELECT auth.uid()));

CREATE POLICY "Update subscription groups"
  ON subscription_groups FOR UPDATE
  TO authenticated
  USING (
    ((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com'
    OR owner_id = (SELECT auth.uid())
  )
  WITH CHECK (
    ((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com'
    OR owner_id = (SELECT auth.uid())
  );

CREATE POLICY "Delete subscription groups"
  ON subscription_groups FOR DELETE
  TO authenticated
  USING (owner_id = (SELECT auth.uid()));

-- MEMBERSHIPS POLICIES
CREATE POLICY "View memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (
    ((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com'
    OR user_id = (SELECT auth.uid())
    OR group_id IN (
      SELECT id FROM subscription_groups 
      WHERE owner_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Create memberships"
  ON memberships FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Update memberships"
  ON memberships FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- TRANSACTIONS POLICIES
CREATE POLICY "View transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    ((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com'
    OR user_id = (SELECT auth.uid())
  );

CREATE POLICY "Create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    ((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com'
    OR user_id = (SELECT auth.uid())
  );

-- WITHDRAWAL REQUESTS POLICIES
CREATE POLICY "View withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (
    ((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com'
    OR user_id = (SELECT auth.uid())
  );

CREATE POLICY "Create withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Update withdrawal requests"
  ON withdrawal_requests FOR UPDATE
  TO authenticated
  USING (((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com')
  WITH CHECK (((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com');

-- PAYMENTS POLICIES
CREATE POLICY "View payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    ((SELECT auth.jwt()) ->> 'email') = 'admin@subsynapse.com'
    OR user_id = (SELECT auth.uid())
  );

CREATE POLICY "Create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- STEP 3: Drop unused indexes (can be recreated if needed)
-- ============================================================================

-- Note: Keeping these indexes as they may become useful with real data
-- They can be manually dropped later if still unused after production use
-- DROP INDEX IF EXISTS idx_payments_user_id;
-- DROP INDEX IF EXISTS idx_payments_razorpay_order_id;
-- DROP INDEX IF EXISTS idx_subscription_groups_category;
-- DROP INDEX IF EXISTS idx_memberships_user_id;
-- DROP INDEX IF EXISTS idx_memberships_group_id;
-- DROP INDEX IF EXISTS idx_transactions_user_id;
-- DROP INDEX IF EXISTS idx_transactions_created_at;
-- DROP INDEX IF EXISTS idx_withdrawal_requests_user_id;
