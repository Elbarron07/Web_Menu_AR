-- Migration: Fix Admin Full Access and Token Security
-- Description: 
--   1. Remove ALL RLS policies on admin_users to avoid recursion
--   2. Recreate is_admin() with SECURITY DEFINER
--   3. Create simple non-recursive RLS policy
--   4. Create get_admin_user_data() function for safe data retrieval
--   5. Promote existing admins to super_admin

-- ============================================================================
-- 1. CLEAN UP ALL POLICIES ON ADMIN_USERS
-- ============================================================================

-- Remove ALL existing policies on admin_users to start fresh
-- This is critical to avoid "infinite recursion detected in policy" errors
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'admin_users')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON admin_users', pol.policyname);
  END LOOP;
END;
$$;

-- ============================================================================
-- 2. RECREATE is_admin() FUNCTION WITH SECURITY DEFINER
-- ============================================================================

-- Recreate with SECURITY DEFINER to bypass RLS when checking admin status
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
-- 3. CREATE get_admin_user_data() FUNCTION FOR SAFE DATA RETRIEVAL
-- ============================================================================

-- This function allows the client to retrieve admin user data without
-- triggering RLS recursion issues
CREATE OR REPLACE FUNCTION get_admin_user_data(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  email text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    au.role,
    au.created_at,
    au.updated_at
  FROM admin_users au
  WHERE au.id = p_user_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_admin_user_data(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_user_data(uuid) TO anon;

-- ============================================================================
-- 4. CREATE SIMPLE NON-RECURSIVE RLS POLICY
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: This is the ONLY policy on admin_users
-- It uses (id = auth.uid()) which is a simple comparison
-- and does NOT reference admin_users table (no recursion)
CREATE POLICY "admin_users_select_self"
  ON admin_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- ============================================================================
-- 5. PROMOTE ALL EXISTING ADMINS TO SUPER_ADMIN
-- ============================================================================

-- This gives all current admins full access
UPDATE admin_users 
SET role = 'super_admin', updated_at = NOW()
WHERE role = 'admin';

-- ============================================================================
-- NOTES
-- ============================================================================
-- IMPORTANT: We removed all complex policies that referenced admin_users table
-- within their USING/WITH CHECK clauses. These caused "infinite recursion"
-- errors because:
--   1. User queries admin_users
--   2. Policy checks if user is super_admin by querying admin_users
--   3. That query triggers the same policy -> infinite loop
--
-- Solution:
--   - Use SECURITY DEFINER functions (is_admin, get_admin_user_data) to bypass RLS
--   - Keep RLS policy simple: only (id = auth.uid()) which doesn't recurse
--   - Edge Functions use service_role key which bypasses RLS entirely
--   - Client-side uses RPC functions for admin checks
