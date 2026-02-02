-- SQL Fix Script for Henry Travel Website
-- Run this in Supabase Dashboard SQL Editor to:
-- 1. Fix the reorder_photos function (loop variable issue)
-- 2. Disable RLS on galleries and photos tables

-- ============================================
-- FIX 1: Fix the reorder_photos function
-- The original had a loop variable scoping issue
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
  -- Iterate through each item in the JSON array
  FOR rec IN SELECT * FROM jsonb_array_elements(p_photo_orders)
  LOOP
    -- Extract values from each JSON object
    photo_id_val := (rec.value ->> 'photo_id')::UUID;
    order_val := (rec.value ->> 'display_order')::INTEGER;
    
    -- Update the photo
    UPDATE photos
    SET display_order = order_val,
        updated_at = NOW()
    WHERE id = photo_id_val
      AND gallery_id = p_gallery_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FIX 2: Disable RLS on galleries table
-- ============================================
ALTER TABLE galleries DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON galleries;
DROP POLICY IF EXISTS "Enable insert access for all users" ON galleries;
DROP POLICY IF EXISTS "Enable update access for all users" ON galleries;
DROP POLICY IF EXISTS "Enable delete access for all users" ON galleries;

-- ============================================
-- FIX 3: Disable RLS on photos table
-- ============================================
ALTER TABLE photos DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON photos;
DROP POLICY IF EXISTS "Enable insert access for all users" ON photos;
DROP POLICY IF EXISTS "Enable update access for all users" ON photos;
DROP POLICY IF EXISTS "Enable delete access for all users" ON photos;

-- ============================================
-- Verify the fixes
-- ============================================
SELECT 'galleries' as table_name, row_security_active as rls_enabled 
FROM pg_tables WHERE tablename = 'galleries'
UNION ALL
SELECT 'photos' as table_name, row_security_active as rls_enabled 
FROM pg_tables WHERE tablename = 'photos';

SELECT 'Function fixed' as status, pg_get_functiondef(oid) as definition
FROM pg_proc WHERE proname = 'reorder_photos';
