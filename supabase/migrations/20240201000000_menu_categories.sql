-- Migration: menu_categories table, seed, menu_items.category_id, backfill, RLS
-- Description: Categories in BDD; link menu_items via category_id.

-- ============================================================================
-- 1. CREATE menu_categories
-- ============================================================================

CREATE TABLE IF NOT EXISTS menu_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  icon text,
  stroke_rgba text,
  glow_rgba text,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 2. SEED categories (from SpinningTacticalMenu + DirectARView)
-- ============================================================================

INSERT INTO menu_categories (name, icon, stroke_rgba, glow_rgba, display_order) VALUES
  ('Pizza', '🍕', 'rgba(255, 107, 53, 0.3)', 'rgba(255, 107, 53, 0.6)', 0),
  ('Hamburger', '🍔', 'rgba(212, 165, 116, 0.3)', 'rgba(212, 165, 116, 0.6)', 1),
  ('Chawarma', '🥙', 'rgba(255, 140, 0, 0.3)', 'rgba(255, 140, 0, 0.6)', 2),
  ('Tacos', '🌮', 'rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.6)', 3),
  ('Sushi', '🍣', 'rgba(32, 178, 170, 0.3)', 'rgba(32, 178, 170, 0.6)', 4),
  ('Pâtes', '🍝', 'rgba(220, 20, 60, 0.3)', 'rgba(220, 20, 60, 0.6)', 5),
  ('Salade', '🥗', 'rgba(152, 251, 152, 0.3)', 'rgba(152, 251, 152, 0.6)', 6),
  ('Desserts', '🍰', 'rgba(218, 112, 214, 0.3)', 'rgba(218, 112, 214, 0.6)', 7),
  ('Boissons', '🥤', 'rgba(0, 206, 209, 0.3)', 'rgba(0, 206, 209, 0.6)', 8),
  ('Plats', '🍽️', 'rgba(255, 215, 0, 0.3)', 'rgba(255, 215, 0, 0.6)', 9),
  ('Entrées', '🥗', 'rgba(37, 99, 235, 0.3)', 'rgba(37, 99, 235, 0.6)', 10),
  ('Frites', '🍟', 'rgba(37, 99, 235, 0.3)', 'rgba(37, 99, 235, 0.6)', 11),
  ('Poulet', '🍗', 'rgba(37, 99, 235, 0.3)', 'rgba(37, 99, 235, 0.6)', 12)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. ADD category_id to menu_items, backfill, drop category
-- ============================================================================

ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES menu_categories(id);

-- Backfill: match category string (trim, case-insensitive) to menu_categories.name
UPDATE menu_items m
SET category_id = c.id
FROM menu_categories c
WHERE m.category_id IS NULL
  AND trim(m.category) IS NOT NULL
  AND trim(m.category) <> ''
  AND lower(trim(m.category)) = lower(c.name);

-- Unmatched → assign to "Plats"
UPDATE menu_items
SET category_id = (SELECT id FROM menu_categories WHERE name = 'Plats' LIMIT 1)
WHERE category_id IS NULL;

-- Enforce NOT NULL (fails if any row still NULL)
ALTER TABLE menu_items ALTER COLUMN category_id SET NOT NULL;

-- Drop old category column
ALTER TABLE menu_items DROP COLUMN IF EXISTS category;

CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);

-- ============================================================================
-- 4. RLS for menu_categories
-- ============================================================================

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select menu_categories"
  ON menu_categories
  FOR SELECT
  TO public
  USING (true);

-- INSERT/UPDATE/DELETE via Edge Functions (service_role) only; no client policies.
