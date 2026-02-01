-- Add storage_path column to photos table for Supabase Storage
-- Run this in Supabase SQL Editor: https://erhvmlxdcplrhmmuboxo.supabase.co/project/sql

-- Add storage_path column for Supabase Storage bucket paths
ALTER TABLE photos ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'photos'
AND column_name IN ('storage_path', 'filename', 'metadata');

-- Show current column status
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'photos'
ORDER BY ordinal_position;
