-- Add storage_path column for Supabase Storage integration
-- Run this in Supabase SQL Editor: https://erhvmlxdcplrhmmuboxo.supabase.co/project/sql

-- Add storage_path column for Supabase Storage bucket path
ALTER TABLE photos ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Add file_size_mb for consistent size display
ALTER TABLE photos ADD COLUMN IF NOT EXISTS file_size_mb TEXT;

-- Add exif_columns if not already added (consolidate EXIF data)
ALTER TABLE photos ADD COLUMN IF NOT EXISTS exif_data JSONB DEFAULT '{}'::jsonb;

-- Add GPS coordinates as separate columns for easier querying
ALTER TABLE photos ADD COLUMN IF NOT EXISTS gps_latitude DOUBLE PRECISION;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS gps_longitude DOUBLE PRECISION;

-- Verify the new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'photos' 
AND column_name IN ('storage_path', 'file_size_mb', 'exif_data', 'gps_latitude', 'gps_longitude')
ORDER BY column_name;

-- Create index on storage_path for faster lookups
CREATE INDEX IF NOT EXISTS idx_photos_storage_path ON photos(storage_path);
