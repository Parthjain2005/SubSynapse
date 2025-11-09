/*
  # Add Remaining Foreign Key Indexes

  1. Problem
    - Multiple foreign keys still lack covering indexes
    - Missing indexes on:
      - memberships.group_id
      - memberships.user_id
      - payments.user_id
      - transactions.user_id
      - withdrawal_requests.user_id

  2. Solution
    - Add indexes for all foreign key columns
    - Improves JOIN performance and foreign key constraint checks
    - Essential for query optimization at scale

  3. Changes
    - Add index on memberships(group_id)
    - Add index on memberships(user_id)
    - Add index on payments(user_id)
    - Add index on transactions(user_id)
    - Add index on withdrawal_requests(user_id)

  4. Notes
    - These indexes will be marked as "unused" initially since there's no real data yet
    - They are critical for production performance when data grows
    - Foreign key columns should ALWAYS be indexed
*/

-- Add missing foreign key indexes for optimal query performance

-- Memberships table indexes
CREATE INDEX IF NOT EXISTS idx_memberships_group_id 
  ON memberships(group_id);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id 
  ON memberships(user_id);

-- Payments table index
CREATE INDEX IF NOT EXISTS idx_payments_user_id 
  ON payments(user_id);

-- Transactions table index
CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
  ON transactions(user_id);

-- Withdrawal requests table index
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id 
  ON withdrawal_requests(user_id);

-- Note: The previously created indexes (subscription_groups.owner_id and 
-- withdrawal_requests.processed_by) are marked as "unused" because there's 
-- minimal data in the database. These indexes are essential for production 
-- performance and should NOT be removed.
