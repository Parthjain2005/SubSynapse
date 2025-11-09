/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - "Admins can view all users" policy causes infinite recursion
    - Policy queries users table from within users table policy
    - This creates a circular dependency

  2. Solution
    - Store admin role in auth.jwt() metadata instead
    - Or use a simpler policy that doesn't query users table
    - For now, we'll remove the problematic policy
    - Admins will use service role or separate admin functions

  3. Changes
    - Drop "Admins can view all users" policy
    - Keep simple user-level policies
    - Admin operations will be handled via service role in Edge Functions
*/

-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can view all users" ON users;

-- Keep only the simple, non-recursive policies
-- Users can view their own profile (no recursion)
-- Users can update their own profile (no recursion)
-- Users can insert their own profile (no recursion)

-- Add a note: For admin operations, we'll create Edge Functions
-- that use the service role key to bypass RLS
