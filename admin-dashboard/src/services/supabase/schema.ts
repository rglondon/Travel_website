/**
 * Supabase Database Schema & Types
 * SQL schema for galleries, photos, and ordering
 */

// ============================================================================
// SQL SCHEMA - Run these in Supabase SQL Editor
// ============================================================================

export const DATABASE_SCHEMA = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- GALLERIES TABLE (Projects)
-- ============================================
CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  
  -- Cover image for display
  cover_image_url TEXT,
  cover_thumbnail_url TEXT,
  
  -- Project context for AI
  project_context TEXT,
  
  -- Settings (JSONB)
  visibility_settings JSONB DEFAULT '{
    "is_public": true,
    "show_on_homepage": false
  }'::jsonb,
  
  -- SEO settings
  seo_settings JSONB DEFAULT '{}'::jsonb,
  
  -- Status
  is_published BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes for galleries
CREATE INDEX idx_galleries_slug ON galleries(slug);
CREATE INDEX idx_galleries_is_published ON galleries(is_published);
CREATE INDEX idx_galleries_created_at ON galleries(created_at DESC);

-- ============================================
-- PHOTOS TABLE
-- ============================================
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_exists4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  
  -- Image URLs
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  original_url TEXT,
  
  -- Image metadata
  file_name VARCHAR(500),
  file_size BIGINT,
  mime_type VARCHAR(100),
  width INTEGER,
  height INTEGER,
  
  -- AI-generated content
  alt_text TEXT,
  field_journal TEXT,        -- The "Story Context" / Field Journal entry
  ai_keywords TEXT[],
  
  -- Display
  display_order INTEGER DEFAULT 0,
  
  -- Telemetry (updated via triggers/webhooks)
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  
  -- Categorization
  category VARCHAR(100),
  tags TEXT[],
  
  -- EXIF data (JSONB)
  exif_data JSONB DEFAULT '{}'::jsonb,
  
  -- GPS data
  gps_latitude DOUBLE PRECISION,
  gps_longitude DOUBLE PRECISION,
  gps_altitude DOUBLE PRECISION,
  
  -- Status
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  needs_review BOOLEAN DEFAULT FALSE,
  
  -- AI processing status
  ai_processed BOOLEAN DEFAULT FALSE,
  ai_model VARCHAR(100),
  ai_processed_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for photos
CREATE INDEX idx_photos_gallery_id ON photos(gallery_id);
CREATE INDEX idx_photos_display_order ON photos(gallery_id, display_order);
CREATE INDEX idx_photos_is_published ON photos(is_published);
CREATE INDEX idx_photos_ai_processed ON photos(ai_processed);

-- ============================================
-- PHOTO ORDERING FUNCTIONS
-- ============================================

-- Function to reorder photos with transaction safety
CREATE OR REPLACE FUNCTION reorder_photos(
  p_gallery_id UUID,
  p_photo_orders ARRAY<JSON>
) RETURNS VOID AS $$
DECLARE
  order_item JSON;
BEGIN
  -- Update each photo's display_order in a single transaction
  FOR order_item IN SELECT * FROM json_array_elements(p_photo_orders)
  LOOP
    UPDATE photos
    SET display_order = (order_item->>'order')::INTEGER,
        updated_at = NOW()
    WHERE id = (order_item->>'photo_id')::UUID
      AND gallery_id = p_gallery_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- GALLERY SUMMARY TABLE
-- ============================================
CREATE TABLE gallery_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
  
  -- Generated content
  narrative_intro TEXT,
  executive_summary TEXT,
  highlights TEXT[],
  
  -- AI metadata
  generation_model VARCHAR(100),
  generation_prompt TEXT,
  tokens_used INTEGER,
  
  -- Approval workflow
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(gallery_id)
);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Run these in Supabase Dashboard > Storage:
-- 1. Create bucket: 'galleries' (public)
-- 2. Create bucket: 'photos-private' (private, for originals)
-- 3. Set up RLS policies as needed
`;

export default DATABASE_SCHEMA;
