-- Migration: RLS Policies and Indexes for Admin API Security
-- Description: Configure Row Level Security policies and indexes for secure admin operations

-- ============================================================================
-- 1. ANALYTICS_EVENTS
-- ============================================================================

-- Enable RLS on analytics_events
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous INSERT for client tracking
CREATE POLICY "Allow anonymous insert for analytics"
  ON analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow authenticated admins to SELECT (via service_role in Edge Functions)
-- Note: Edge Functions use service_role, so this policy is for consistency
-- If admins access directly, they must be in admin_users
CREATE POLICY "Allow admin select analytics"
  ON analytics_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
    )
  );

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
  ON analytics_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id 
  ON analytics_events(session_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type 
  ON analytics_events(event_type);

CREATE INDEX IF NOT EXISTS idx_analytics_events_menu_item_id 
  ON analytics_events(menu_item_id) 
  WHERE menu_item_id IS NOT NULL;

-- ============================================================================
-- 2. MENU_ITEMS
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public SELECT (menu reading)
CREATE POLICY "Allow public select menu_items"
  ON menu_items
  FOR SELECT
  TO public
  USING (true);

-- Policy: Restrict INSERT/UPDATE/DELETE to service_role only
-- Edge Functions will use service_role, so no direct client writes
-- Drop existing policies if they allow client writes
DROP POLICY IF EXISTS "Allow admin insert menu_items" ON menu_items;
DROP POLICY IF EXISTS "Allow admin update menu_items" ON menu_items;
DROP POLICY IF EXISTS "Allow admin delete menu_items" ON menu_items;

-- ============================================================================
-- 3. MENU_ITEM_VARIANTS
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE menu_item_variants ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public SELECT
CREATE POLICY "Allow public select menu_item_variants"
  ON menu_item_variants
  FOR SELECT
  TO public
  USING (true);

-- Drop existing write policies if they exist
DROP POLICY IF EXISTS "Allow admin insert menu_item_variants" ON menu_item_variants;
DROP POLICY IF EXISTS "Allow admin update menu_item_variants" ON menu_item_variants;
DROP POLICY IF EXISTS "Allow admin delete menu_item_variants" ON menu_item_variants;

-- ============================================================================
-- 4. MENU_ITEM_HOTSPOTS
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE menu_item_hotspots ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public SELECT
CREATE POLICY "Allow public select menu_item_hotspots"
  ON menu_item_hotspots
  FOR SELECT
  TO public
  USING (true);

-- Drop existing write policies if they exist
DROP POLICY IF EXISTS "Allow admin insert menu_item_hotspots" ON menu_item_hotspots;
DROP POLICY IF EXISTS "Allow admin update menu_item_hotspots" ON menu_item_hotspots;
DROP POLICY IF EXISTS "Allow admin delete menu_item_hotspots" ON menu_item_hotspots;

-- ============================================================================
-- 5. RESTAURANT_SETTINGS
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public SELECT (if needed for public display)
CREATE POLICY "Allow public select restaurant_settings"
  ON restaurant_settings
  FOR SELECT
  TO public
  USING (true);

-- Drop existing write policies if they exist
DROP POLICY IF EXISTS "Allow admin insert restaurant_settings" ON restaurant_settings;
DROP POLICY IF EXISTS "Allow admin update restaurant_settings" ON restaurant_settings;
DROP POLICY IF EXISTS "Allow admin delete restaurant_settings" ON restaurant_settings;

-- ============================================================================
-- 6. ADMIN_USERS
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Restrict all access to service_role only
-- No direct client access to admin_users table
DROP POLICY IF EXISTS "Allow admin select admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin insert admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin update admin_users" ON admin_users;
DROP POLICY IF EXISTS "Allow admin delete admin_users" ON admin_users;

-- ============================================================================
-- NOTES
-- ============================================================================
-- All INSERT/UPDATE/DELETE operations on menu_items, menu_item_variants,
-- menu_item_hotspots, restaurant_settings, and admin_users must go through
-- Edge Functions using service_role key.
--
-- Analytics INSERT is allowed for anonymous users (client tracking).
-- Analytics SELECT is restricted to authenticated admins (or via Edge Functions).
