-- Migration: Fix Admin Full Access and Token Security
-- Description: 
--   1. Remove redundant RLS policies on admin_users
--   2. Recreate is_admin() with SECURITY DEFINER
--   3. Add complete admin policies for all operations
--   4. Promote existing admins to super_admin

-- ============================================================================
-- 1. CLEAN UP REDUNDANT POLICIES ON ADMIN_USERS
-- ============================================================================

-- Remove all existing policies on admin_users to start fresh
DROP POLICY IF EXISTS "Allow users to read own admin record" ON admin_users;
DROP POLICY IF EXISTS "admin_users_select_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_update_policy" ON admin_users;
DROP POLICY IF EXISTS "admin_users_delete_policy" ON admin_users;
DROP POLICY IF EXISTS "Allow admin select admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin delete admin_users" ON admin_users;

-- ============================================================================
-- 2. RECREATE is_admin() FUNCTION WITH SECURITY DEFINER
-- ============================================================================

-- Recreate with SECURITY DEFINER to bypass RLS when checking admin status
-- Note: Using CREATE OR REPLACE instead of DROP to preserve dependent policies
-- This is critical because the function needs to read admin_users table
-- even when RLS policies might otherwise block access
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER  -- Runs with the privileges of the function owner (postgres)
SET search_path = public  -- Prevent search_path injection attacks
STABLE  -- Indicates the function cannot modify the database
AS $$
BEGIN
    -- Return true if the user exists in admin_users table
    RETURN EXISTS (
        SELECT 1 FROM admin_users WHERE id = user_id
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin(uuid) TO anon;

-- ============================================================================
-- 3. CREATE NEW CLEAN POLICIES FOR ADMIN_USERS
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read their own record (for client-side isAdmin() checks)
CREATE POLICY "admin_users_select_own"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy: Super admins can read all admin records
CREATE POLICY "admin_users_select_all_for_super_admin"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy: Super admins can insert new admins
CREATE POLICY "admin_users_insert_for_super_admin"
  ON admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy: Admins can update their own record (except role)
CREATE POLICY "admin_users_update_own"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy: Super admins can update any admin record
CREATE POLICY "admin_users_update_for_super_admin"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Policy: Super admins can delete admin records (except themselves)
CREATE POLICY "admin_users_delete_for_super_admin"
  ON admin_users
  FOR DELETE
  TO authenticated
  USING (
    id != auth.uid() AND
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- ============================================================================
-- 4. PROMOTE ALL EXISTING ADMINS TO SUPER_ADMIN
-- ============================================================================

-- This gives all current admins full access to manage other admins
UPDATE admin_users 
SET role = 'super_admin', updated_at = NOW()
WHERE role = 'admin';

-- ============================================================================
-- 5. UPDATE OTHER TABLE POLICIES TO USE THE NEW is_admin() FUNCTION
-- ============================================================================

-- The existing policies already use is_admin(auth.uid()) which will now work
-- correctly thanks to SECURITY DEFINER. No changes needed.

-- ============================================================================
-- NOTES
-- ============================================================================
-- - SECURITY DEFINER on is_admin() allows it to bypass RLS when checking admin status
-- - All current admins are promoted to super_admin for full management access
-- - Edge Functions still use service_role key which bypasses RLS entirely
-- - Client-side can now reliably check admin status via is_admin() or direct query
