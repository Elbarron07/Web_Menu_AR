-- Migration: Fix RLS policies for admin_users table
-- Description: Allow authenticated users to read their own admin_users record
-- This fixes the issue where admins cannot verify their admin status from the client

-- ============================================================================
-- ADMIN_USERS RLS POLICIES
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Allow admin select admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin delete admin_users" ON admin_users;

-- Policy: Allow authenticated users to read their own admin_users record
-- This is necessary for authService.isAdmin() and authService.getAdminUser() to work
CREATE POLICY "Allow users to read own admin record"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Note: INSERT/UPDATE/DELETE operations on admin_users must still go through
-- Edge Functions using service_role key for security.
-- Only SELECT is allowed for authenticated users to verify their own admin status.
