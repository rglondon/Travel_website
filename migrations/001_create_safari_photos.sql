-- Supabase/PostgreSQL Schema for Henry Travel Website
-- Database: henry_travel_db

-- Enable UUID extension for better IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SAFARI PHOTOS TABLE
-- ============================================================================
CREATE TABLE safari_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core photo fields
    image_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    
    -- Photo metadata (from original SafariPhoto type)
    alt_text VARCHAR(255),
    caption VARCHAR(255),
    location VARCHAR(100),
    photographer VARCHAR(100),
    date_taken DATE,
    
    -- Telemetry fields (from original SafariPhoto type)
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    downloads INTEGER DEFAULT 0,
    avg_time_watched_seconds INTEGER DEFAULT 0,
    bounce_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- New fields requested by Rohan
    story_context TEXT,  -- Long-form description/story behind the photo
    display_order INTEGER DEFAULT 0,  -- For manual sorting in UI
    
    -- Categorization
    category VARCHAR(50),  -- e.g., 'wildlife', 'landscape', 'culture', 'accommodation'
    tags TEXT[],  -- Array of tags for filtering
    
    -- Status and timestamps
    is_published BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_safari_photos_category ON safari_photos(category);
CREATE INDEX idx_safari_photos_display_order ON safari_photos(display_order ASC);
CREATE INDEX idx_safari_photos_is_published ON safari_photos(is_published);
CREATE INDEX idx_safari_photos_is_featured ON safari_photos(is_featured);
CREATE INDEX idx_safari_photos_tags ON safari_photos USING GIN(tags);
CREATE INDEX idx_safari_photos_created_at ON safari_photos(created_at DESC);

-- ============================================================================
-- PHOTO ANALYTICS TABLE (for detailed tracking)
-- ============================================================================
CREATE TABLE photo_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    photo_id UUID REFERENCES safari_photos(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,  -- 'view', 'like', 'share', 'download'
    user_id UUID REFERENCES auth.users(id),
    session_id VARCHAR(100),
    device_type VARCHAR(20),
    country_code VARCHAR(3),
    referrer_url VARCHAR(500),
    time_spent_seconds INTEGER,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_photo_analytics_photo_id ON photo_analytics(photo_id);
CREATE INDEX idx_photo_analytics_event_type ON photo_analytics(event_type);
CREATE INDEX idx_photo_analytics_timestamp ON photo_analytics(event_timestamp DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE safari_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_analytics ENABLE ROW LEVEL SECURITY;

-- Public can read published photos
CREATE POLICY "Public can view published photos" ON safari_photos
    FOR SELECT USING (is_published = TRUE);

-- Admin-only policies (requires authenticated user with admin role)
CREATE POLICY "Admins can manage all photos" ON safari_photos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

CREATE POLICY "Admins can view all analytics" ON photo_analytics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_user_meta_data->>'role' = 'admin'
        )
    );

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_safari_photos_updated_at
    BEFORE UPDATE ON safari_photos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to increment view count (for high-traffic optimization)
CREATE OR REPLACE FUNCTION increment_view_count(photo_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE safari_photos 
    SET views = views + 1 
    WHERE id = photo_id;
END;
$$ language 'plpgsql';

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================
INSERT INTO safari_photos (image_url, alt_text, caption, location, category, story_context, display_order, is_featured, tags, views, likes)
VALUES 
(
    'https://example.com/safari/lion-sunset.jpg',
    'Lion at sunset in Serengeti',
    'A majestic lion surveying his territory during golden hour',
    'Serengeti, Tanzania',
    'wildlife',
    'This photo was taken during our 2024 dry season expedition. We waited for 3 hours at a waterhole before this young male lion approached. The golden light created this incredible rim lighting effect on his mane.',
    1,
    TRUE,
    ARRAY['lion', 'serengeti', 'sunset', 'wildlife', 'africa'],
    1250,
    89
),
(
    'https://example.com/safari/elephants-herd.jpg',
    'Elephant herd crossing the plains',
    'A family of elephants on their morning migration',
    'Masai Mara, Kenya',
    'wildlife',
    'We captured this at dawn when the herd was moving to new grazing grounds. The matriarch led the way with her newborn calf following closely. Notice how the younger elephants stay protected in the middle of the formation.',
    2,
    TRUE,
    ARRAY['elephant', 'masai-mara', 'herd', 'migration', 'family'],
    980,
    67
),
(
    'https://example.com/safari/zebra-stripes.jpg',
    'Close-up of zebra stripes',
    'The unique pattern of a plains zebra',
    'Ngorongoro, Tanzania',
    'wildlife',
    'Macro shot showing the intricate pattern of zebra stripes. Each stripe pattern is unique to individual zebras, much like human fingerprints. This helps with camouflage and fly repulsion.',
    3,
    FALSE,
    ARRAY['zebra', 'stripes', 'macro', 'pattern', 'ngorongoro'],
    654,
    45
);
