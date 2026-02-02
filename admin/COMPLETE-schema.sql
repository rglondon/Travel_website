-- Henry Travel Website - COMPLETE Schema Script
-- Run this in Supabase SQL Editor (https://erhvmlxdcplrhmmuboxo.supabase.co/project/sql)
-- This creates tables, fixes the function, and disables RLS

-- ============================================
-- STEP 1: Enable UUID extension
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 2: Drop existing tables (clean slate)
-- ============================================
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS galleries CASCADE;

-- ============================================
-- STEP 3: Create GALLERIES table (Projects)
-- ============================================
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  cover_image_url TEXT,
  project_context TEXT,
  visibility_settings JSONB DEFAULT '{"is_public": true, "show_on_homepage": false}'::jsonb,
  seo_settings JSONB DEFAULT '{}'::jsonb,
  is_published BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- ============================================
-- STEP 4: Create PHOTOS table
-- ============================================
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  field_journal TEXT,
  ai_keywords TEXT[],
  display_order INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- STEP 5: Create indexes
-- ============================================
CREATE INDEX idx_galleries_slug ON galleries(slug);
CREATE INDEX idx_galleries_is_published ON galleries(is_published);
CREATE INDEX idx_photos_gallery_id ON photos(gallery_id);
CREATE INDEX idx_photos_display_order ON photos(gallery_id, display_order);

-- ============================================
-- STEP 6: Create FIXED reorder_photos function
-- (Fixed loop variable scoping issue)
-- ============================================
DROP FUNCTION IF EXISTS reorder_photos(UUID, JSONB);

CREATE OR REPLACE FUNCTION reorder_photos(
  p_gallery_id UUID,
  p_photo_orders JSONB
) RETURNS VOID AS $$
DECLARE
  rec RECORD;
  photo_id_val UUID;
  order_val INTEGER;
BEGIN
  FOR rec IN SELECT * FROM jsonb_array_elements(p_photo_orders)
  LOOP
    photo_id_val := (rec.value ->> 'photo_id')::UUID;
    order_val := (rec.value ->> 'display_order')::INTEGER;
    
    UPDATE photos
    SET display_order = order_val,
        updated_at = NOW()
    WHERE id = photo_id_val
      AND gallery_id = p_gallery_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 7: Insert sample galleries
-- ============================================
INSERT INTO galleries (id, title, slug, description, is_published, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Varanasi', 'varanasi', 'A visual journey through the ghats of the holy city', true, true),
  ('22222222-2222-2222-2222-222222222222', 'Masai Mara', 'masai-mara', 'Wildlife encounters in the great savanna', true, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 8: Insert sample photos (Masai Mara)
-- ============================================
INSERT INTO photos (id, gallery_id, image_url, alt_text, field_journal, display_order, is_published)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', 'Lion in Serengeti', 'Male lion resting in the afternoon heat, scanning the horizon.', 1, true),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800', 'Elephant family', 'Matriarch leading herd to water hole during golden hour.', 2, true),
  ('c3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?w=800', 'Zebra migration', 'Zebras on the move during the Great Migration.', 3, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STEP 9: DISABLE RLS (Critical for browser access)
-- ============================================
ALTER TABLE galleries DISABLE ROW LEVEL SECURITY;
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;

-- Drop any existing RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON galleries;
DROP POLICY IF EXISTS "Enable read access for all users" ON photos;

-- ============================================
-- VERIFICATION: Show created objects
-- ============================================
SELECT 'Tables created:' as status, COUNT(*) as count 
FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('galleries', 'photos');

SELECT 'galleries RLS disabled' as status WHERE NOT EXISTS (
  SELECT 1 FROM pg_tables WHERE tablename = 'galleries' AND row_security_active
);

SELECT 'photos RLS disabled' as status WHERE NOT EXISTS (
  SELECT 1 FROM pg_tables WHERE tablename = 'photos' AND row_security_active
);

SELECT 'Galleries count:' as label, COUNT(*) as value FROM galleries;
SELECT 'Photos count:' as label, COUNT(*) as value FROM photos;

-- Show sample data
SELECT 'Sample galleries:' as info;
SELECT id, title, slug, description FROM galleries LIMIT 5;
