-- Create reorder_photos function on new Supabase project
-- Run this in Supabase SQL Editor: https://erhvmlxdcplrhmmuboxo.supabase.co/project/sql

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
  FOR rec IN SELECT * FROM jsonb_array_elements(p_photo_orders)
  LOOP
    photo_id_val := (rec.value ->> 'photo_id')::UUID;
    order_val := (rec.value ->> 'display_order')::INTEGER;
    
    UPDATE photos
    SET display_order = order_val,
        updated_at = NOW()
    WHERE id = photo_id_val
      AND gallery_id = p_gallery_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Verify
SELECT 'Function created:' as status, proname as function_name 
FROM pg_proc WHERE proname = 'reorder_photos';
