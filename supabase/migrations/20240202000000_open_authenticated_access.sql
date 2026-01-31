-- Migration: Accès complet pour tous les utilisateurs authentifiés
-- Cette migration configure les RLS policies pour permettre aux utilisateurs
-- authentifiés d'accéder à toutes les tables admin sans restriction

-- ============================================================================
-- 1. MENU_CATEGORIES - Accès complet pour utilisateurs authentifiés
-- ============================================================================

-- Supprimer les anciennes policies
DROP POLICY IF EXISTS "menu_categories_select_all" ON menu_categories;
DROP POLICY IF EXISTS "menu_categories_insert_auth" ON menu_categories;
DROP POLICY IF EXISTS "menu_categories_update_auth" ON menu_categories;
DROP POLICY IF EXISTS "menu_categories_delete_auth" ON menu_categories;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON menu_categories;

-- Activer RLS
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "menu_categories_select_public" ON menu_categories
  FOR SELECT TO anon, authenticated USING (true);

-- CRUD pour utilisateurs authentifiés
CREATE POLICY "menu_categories_insert_authenticated" ON menu_categories
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "menu_categories_update_authenticated" ON menu_categories
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "menu_categories_delete_authenticated" ON menu_categories
  FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 2. MENU_ITEMS - Accès complet pour utilisateurs authentifiés
-- ============================================================================

DROP POLICY IF EXISTS "menu_items_select_all" ON menu_items;
DROP POLICY IF EXISTS "menu_items_insert_auth" ON menu_items;
DROP POLICY IF EXISTS "menu_items_update_auth" ON menu_items;
DROP POLICY IF EXISTS "menu_items_delete_auth" ON menu_items;
DROP POLICY IF EXISTS "Authenticated users can manage menu items" ON menu_items;

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_items_select_public" ON menu_items
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "menu_items_insert_authenticated" ON menu_items
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "menu_items_update_authenticated" ON menu_items
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "menu_items_delete_authenticated" ON menu_items
  FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 3. MENU_ITEM_VARIANTS - Accès complet pour utilisateurs authentifiés
-- ============================================================================

DROP POLICY IF EXISTS "menu_item_variants_select_all" ON menu_item_variants;
DROP POLICY IF EXISTS "menu_item_variants_insert_auth" ON menu_item_variants;
DROP POLICY IF EXISTS "menu_item_variants_update_auth" ON menu_item_variants;
DROP POLICY IF EXISTS "menu_item_variants_delete_auth" ON menu_item_variants;

ALTER TABLE menu_item_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_item_variants_select_public" ON menu_item_variants
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "menu_item_variants_insert_authenticated" ON menu_item_variants
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "menu_item_variants_update_authenticated" ON menu_item_variants
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "menu_item_variants_delete_authenticated" ON menu_item_variants
  FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 4. MENU_ITEM_HOTSPOTS - Accès complet pour utilisateurs authentifiés
-- ============================================================================

DROP POLICY IF EXISTS "menu_item_hotspots_select_all" ON menu_item_hotspots;
DROP POLICY IF EXISTS "menu_item_hotspots_insert_auth" ON menu_item_hotspots;
DROP POLICY IF EXISTS "menu_item_hotspots_update_auth" ON menu_item_hotspots;
DROP POLICY IF EXISTS "menu_item_hotspots_delete_auth" ON menu_item_hotspots;

ALTER TABLE menu_item_hotspots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "menu_item_hotspots_select_public" ON menu_item_hotspots
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "menu_item_hotspots_insert_authenticated" ON menu_item_hotspots
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "menu_item_hotspots_update_authenticated" ON menu_item_hotspots
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "menu_item_hotspots_delete_authenticated" ON menu_item_hotspots
  FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- 5. RESTAURANT_SETTINGS - Accès complet pour utilisateurs authentifiés
-- ============================================================================

DROP POLICY IF EXISTS "restaurant_settings_select_all" ON restaurant_settings;
DROP POLICY IF EXISTS "restaurant_settings_insert_auth" ON restaurant_settings;
DROP POLICY IF EXISTS "restaurant_settings_update_auth" ON restaurant_settings;

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS restaurant_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  theme_color text DEFAULT '#f59e0b',
  qr_code_base_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE restaurant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restaurant_settings_select_public" ON restaurant_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "restaurant_settings_insert_authenticated" ON restaurant_settings
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "restaurant_settings_update_authenticated" ON restaurant_settings
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- 6. ANALYTICS_EVENTS - Accès complet pour utilisateurs authentifiés
-- ============================================================================

DROP POLICY IF EXISTS "analytics_events_select_auth" ON analytics_events;
DROP POLICY IF EXISTS "analytics_events_insert_all" ON analytics_events;

-- Créer la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  menu_item_id text,
  session_id text,
  duration integer,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Lecture pour authentifiés, insertion pour tous (tracking anonyme)
CREATE POLICY "analytics_events_select_authenticated" ON analytics_events
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "analytics_events_insert_public" ON analytics_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- ============================================================================
-- 7. INDEX pour performances
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_menu_item_id ON analytics_events(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);

-- ============================================================================
-- NOTES
-- ============================================================================
-- Cette migration donne un accès complet à tous les utilisateurs authentifiés.
-- Pour une application en production, vous pourriez vouloir restreindre
-- certaines opérations à des rôles spécifiques.
