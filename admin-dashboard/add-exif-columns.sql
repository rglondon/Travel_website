-- Add EXIF columns to photos table
-- Run this in Supabase SQL Editor: https://erhvmlxdcplrhmmuboxo.supabase.co/project/sql

ALTER TABLE photos ADD COLUMN IF NOT EXISTS exif_model TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS exif_lens TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS exif_fstop TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS exif_iso TEXT;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'photos' 
AND column_name IN ('exif_model', 'exif_lens', 'exif_fstop', 'exif_iso');
