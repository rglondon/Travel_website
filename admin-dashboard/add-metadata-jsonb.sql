-- Add metadata JSONB column and AI columns to photos table
-- Run this in Supabase SQL Editor: https://erhvmlxdcplrhmmuboxo.supabase.co/project/sql

-- Add metadata JSONB column for EXIF and GPS data
ALTER TABLE photos ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add AI columns
ALTER TABLE photos ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT FALSE;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS ai_tags TEXT[];

-- Enable RLS is already disabled per your earlier request

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'photos' 
AND column_name IN ('metadata', 'ai_processed', 'ai_tags');
