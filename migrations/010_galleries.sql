-- ============================================================================
-- GALLERIES TABLE MIGRATION
-- Adds galleries table with JSONB settings for SEO/visibility
-- Database: henry_travel_db
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- GALLERIES TABLE
-- ============================================================================
CREATE TABLE galleries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core gallery fields
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    cover_image_url VARCHAR(500),
    
    -- SEO Settings (JSONB)
    seo_settings JSONB DEFAULT '{
        "metaTitle": "",
        "metaDescription": "",
        "keywords": [],
        "ogImage": "",
        "canonicalUrl": "",
        "noIndex": false,
        "noFollow": false
    }'::jsonb,
    
    -- Visibility Settings (JSONB)
    visibility_settings JSONB DEFAULT '{
        "isPublic": true,
        "password": null,
        "allowedRoles": [],
        "showOnHomepage": false,
        "homepageOrder": 0,
        "startDate": null,
        "endDate": null
    }'::jsonb,
    
    -- Display Settings (JSONB)
    display_settings JSONB DEFAULT '{
        "layout": "grid",
        "photoPerPage": 20,
        "showLocation": true,
        "showDate": true,
        "showPhotographer": true,
        "enableLightbox": true,
        "enableDownload": false
    }'::jsonb,
    
    -- Statistics (updated via triggers/functions)
    photo_count INTEGER DEFAULT 0,
    total_views BIGINT DEFAULT 0,
    
    -- Status
    is_published BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    
    -- Ownership
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- GALLERY PHOTOS TABLE (links photos to galleries)
-- ============================================================================
CREATE TABLE gallery_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
    photo_id UUID NOT NULL REFERENCES safari_photos(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    caption_override TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(gallery_id, photo_id)
);

-- ============================================================================
-- GALLERY AI SUMMARY TABLE (stores generated project intros)
-- ============================================================================
CREATE TABLE gallery_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
    
    -- Generated content
    project_intro TEXT,
    executive_summary TEXT,
    highlights TEXT[],
    
    -- AI metadata
    generation_model VARCHAR(100),
    generation_prompt TEXT,
    generation_params JSONB,
    tokens_used INTEGER,
    
    -- Status
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_galleries_slug ON galleries(slug);
CREATE INDEX idx_galleries_is_published ON galleries(is_published);
CREATE INDEX idx_galleries_is_active ON galleries(is_active);
CREATE INDEX idx_galleries_cover_image ON galleries(cover_image_url);
CREATE INDEX idx_gallery_photos_gallery_id ON gallery_photos(gallery_id);
CREATE INDEX idx_gallery_photos_photo_id ON gallery_photos(photo_id);
CREATE INDEX idx_gallery_summaries_gallery_id ON gallery_summaries(gallery_id);

-- ============================================================================
-- GIN INDEXES FOR JSONB FIELDS
-- ============================================================================
CREATE INDEX idx_galleries_seo_settings ON galleries USING GIN (seo_settings);
CREATE INDEX idx_galleries_visibility_settings ON galleries USING GIN (visibility_settings);
CREATE INDEX idx_galleries_display_settings ON galleries USING GIN (display_settings);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_gallery_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to update photo count when gallery_photos changes
CREATE OR REPLACE FUNCTION update_gallery_photo_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE galleries 
        SET photo_count = photo_count - 1 
        WHERE id = OLD.gallery_id;
        RETURN OLD;
    ELSE
        -- INSERT or UPDATE
        UPDATE galleries 
        SET photo_count = (
            SELECT COUNT(*) FROM gallery_photos WHERE gallery_id = NEW.gallery_id
        )
        WHERE id = NEW.gallery_id;
        RETURN NEW;
    END IF;
END;
$$ language 'plpgsql';

-- Function to generate slug from name
CREATE OR REPLACE FUNCTION generate_gallery_slug(name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    base_slug VARCHAR;
    new_slug VARCHAR;
    counter INTEGER := 1;
BEGIN
    base_slug := LOWER(REGEXP_REPLACE(name, '[^a-z0-9\s-]', '', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := REGEXP_REPLACE(base_slug, '-+$', '');
    base_slug := REGEXP_REPLACE(base_slug, '^-+', '');
    
    new_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM galleries WHERE slug = new_slug) LOOP
        new_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN new_slug;
END;
$$ language 'plpgsql';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to auto-update updated_at
CREATE TRIGGER update_galleries_updated_at
    BEFORE UPDATE ON galleries
    FOR EACH ROW
    EXECUTE FUNCTION update_gallery_updated_at_column();

-- Trigger to auto-update photo count
CREATE TRIGGER update_gallery_photo_count_trigger
    AFTER INSERT OR DELETE ON gallery_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_gallery_photo_count();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_summaries ENABLE ROW LEVEL SECURITY;

-- Public can read published galleries
CREATE POLICY "Public can view published galleries" ON galleries
    FOR SELECT USING (
        is_published = TRUE 
        AND is_active = TRUE
        AND (visibility_settings->>'isPublic')::boolean = TRUE
    );

-- Admin-only policies for galleries
CREATE POLICY "Admins can manage all galleries" ON galleries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can manage gallery photos" ON gallery_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can manage gallery summaries" ON gallery_summaries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- ============================================================================
-- SAMPLE GALLERY DATA (for testing)
-- ============================================================================
INSERT INTO galleries (id, name, slug, description, cover_image_url, photo_count, is_published, published_at, visibility_settings)
VALUES 
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Serengeti Wildlife Safari',
    'serengeti-wildlife-safari',
    'Experience the breathtaking wildlife of Serengeti National Park in Tanzania. From majestic lions to massive elephant herds.',
    'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
    15,
    TRUE,
    NOW(),
    '{"isPublic": true, "showOnHomepage": true, "homepageOrder": 1}'::jsonb
),
(
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'Masai Mara Adventure',
    'masai-mara-adventure',
    'Join us on an unforgettable journey through the iconic Masai Mara, home to the Great Migration.',
    'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800',
    12,
    TRUE,
    NOW(),
    '{"isPublic": true, "showOnHomepage": true, "homepageOrder": 2}'::jsonb
),
(
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'Ngorongoro Crater',
    'ngorongoro-crater',
    'Explore the wonders of Ngorongoro Crater, a UNESCO World Heritage Site and natural wonder.',
    'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?w=800',
    8,
    TRUE,
    NOW(),
    '{"isPublic": true, "showOnHomepage": false, "homepageOrder": 0}'::jsonb
);

-- Add sample summary for first gallery
INSERT INTO gallery_summaries (gallery_id, project_intro, executive_summary, highlights, generation_model, is_approved)
VALUES 
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    -- This would be generated by AI, stored for reference
    'Our Serengeti Wildlife Safari takes you deep into the heart of one of Africa''s most iconic wildlife destinations. Over the course of 7 unforgettable days, we documented the incredible biodiversity that makes the Serengeti so special.',
    'A comprehensive wildlife photography expedition capturing the essence of Serengeti''s ecosystem through careful observation and patience.',
    ARRAY['Lion prides at dawn', 'Elephant migrations', 'Cheetah hunts', 'Sunset silhouettes', 'Nocturnal wildlife'],
    'minimax-m2.1-vision',
    TRUE
);

-- Link some photos to galleries
INSERT INTO gallery_photos (gallery_id, photo_id, display_order, is_featured)
VALUES 
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '1',
    1,
    TRUE
),
(
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    '2',
    2,
    FALSE
),
(
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    '3',
    1,
    TRUE
);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE galleries IS 'Stores gallery/project collections with SEO and visibility settings';
COMMENT ON TABLE gallery_photos IS 'Junction table linking photos to galleries with display order';
COMMENT ON TABLE gallery_summaries IS 'Stores AI-generated project intros and summaries for galleries';
COMMENT ON COLUMN galleries.seo_settings IS 'JSONB for SEO meta fields: metaTitle, metaDescription, keywords, ogImage, canonicalUrl, noIndex, noFollow';
COMMENT ON COLUMN galleries.visibility_settings IS 'JSONB for visibility: isPublic, password, allowedRoles, showOnHomepage, homepageOrder, startDate, endDate';
COMMENT ON COLUMN galleries.display_settings IS 'JSONB for display preferences: layout, photoPerPage, showLocation, showDate, showPhotographer, enableLightbox, enableDownload';
