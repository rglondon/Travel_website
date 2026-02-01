-- Add metadata columns to photos table
-- Run this in Supabase SQL Editor: https://erhvmlxdcplrhmmuboxo.supabase.co/project/sql

ALTER TABLE photos ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS file_size TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS ai_tags TEXT[];

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'photos' 
AND column_name IN ('filename', 'file_size', 'location', 'ai_tags');
