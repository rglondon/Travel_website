-- Henry Travel Website - Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- GALLERIES TABLE (Projects)
-- ============================================
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS galleries CASCADE;

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
-- PHOTOS TABLE
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
-- INDEXES
-- ============================================
CREATE INDEX idx_galleries_slug ON galleries(slug);
CREATE INDEX idx_galleries_is_published ON galleries(is_published);
CREATE INDEX idx_photos_gallery_id ON photos(gallery_id);
CREATE INDEX idx_photos_display_order ON photos(gallery_id, display_order);

-- ============================================
-- PHOTO ORDERING FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION reorder_photos(
  p_gallery_id UUID,
  p_photo_orders JSONB
) RETURNS VOID AS $$
DECLARE
  order_item JSON;
BEGIN
  FOR order_item IN SELECT * FROM jsonb_array_elements(p_photo_orders)
  LOOP
    UPDATE photos
    SET display_order = (order_item->>'display_order')::INTEGER,
        updated_at = NOW()
    WHERE id = (order_item->>'photo_id')::UUID
      AND gallery_id = p_gallery_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
INSERT INTO galleries (id, title, slug, description, is_published, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Varanasi', 'varanasi', 'A visual journey through the ghats of the holy city', true, true),
  ('22222222-2222-2222-2222-222222222222', 'Masai Mara', 'masai-mara', 'Wildlife encounters in the great savanna', true, true);

INSERT INTO photos (id, gallery_id, image_url, alt_text, field_journal, display_order, is_published)
VALUES 
  ('a1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', 'Lion in Serengeti', 'Male lion resting in the afternoon heat, scanning the horizon for his pride.', 1, true),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800', 'Elephant family', 'Matriarch leading herd to water hole during golden hour.', 2, true),
  ('c3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?w=800', 'Zebra migration', 'Zebras on the move during the Great Migration.', 3, true);

SELECT 'Schema created successfully! Run migrations: ' || COUNT(*) || ' tables' FROM information_schema.tables WHERE table_schema = 'public';
