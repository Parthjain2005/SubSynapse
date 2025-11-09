/*
  # Fix Security Issues - Part 1: Add Missing Indexes

  1. Problem
    - Foreign keys without covering indexes cause suboptimal query performance
    - Missing indexes on:
      - subscription_groups.owner_id
      - withdrawal_requests.processed_by

  2. Solution
    - Add indexes for all foreign key columns
    - Improves JOIN and foreign key constraint check performance

  3. Changes
    - Add index on subscription_groups(owner_id)
    - Add index on withdrawal_requests(processed_by)
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_subscription_groups_owner_id 
  ON subscription_groups(owner_id);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_processed_by 
  ON withdrawal_requests(processed_by);
