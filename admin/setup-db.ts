/**
 * Database Setup Script - Run with Service Role Key
 * Usage: npx tsx setup-db.ts
 * 
 * Get service role key from: https://erhvmlxdcplrhmmuboxo.supabase.co/project/settings/api
 */

import { createClient } from '@supabase/supabase-js';

// Use SERVICE ROLE KEY for admin operations
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://erhvmlxdcplrhmmuboxo.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SERVICE_ROLE_KEY) {
  console.log('❌ Error: SUPABASE_SERVICE_KEY environment variable not set');
  console.log('📝 Run with: SUPABASE_SERVICE_KEY=your-service-role-key npx tsx setup-db.ts');
  console.log('🔑 Get key from: https://erhvmlxdcplrhmmuboxo.supabase.co/project/settings/api');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setupDatabase() {
  console.log('🔄 Setting up database...\n');

  try {
    // Enable UUID extension
    console.log('1. Enabling UUID extension...');
    await supabase.rpc('exec_sql', { sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"' }).catch(() => {});

    // Create galleries table
    console.log('2. Creating galleries table...');
    const { error: galleriesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS galleries (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          title VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL UNIQUE,
          description TEXT,
          cover_image_url TEXT,
          project_context TEXT,
          visibility_settings JSONB DEFAULT '{"is_public": true, "show_on_homepage": false}'::jsonb,
          seo_settings JSONB DEFAULT '{}'::jsonb,
          is_published BOOLEAN DEFAULT FALSE,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          published_at TIMESTAMPTZ
        )
      `
    });
    if (galleriesError) console.log('   Note:', galleriesError.message);

    // Create photos table
    console.log('3. Creating photos table...');
    const { error: photosError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS photos (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          gallery_id UUID NOT NULL REFERENCES galleries(id) ON DELETE CASCADE,
          image_url TEXT NOT NULL,
          thumbnail_url TEXT,
          alt_text TEXT,
          field_journal TEXT,
          ai_keywords TEXT[],
          display_order INTEGER DEFAULT 0,
          views INTEGER DEFAULT 0,
          likes INTEGER DEFAULT 0,
          shares INTEGER DEFAULT 0,
          is_published BOOLEAN DEFAULT FALSE,
          is_featured BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    });
    if (photosError) console.log('   Note:', photosError.message);

    // Create indexes
    console.log('4. Creating indexes...');
    await supabase.rpc('exec_sql', { sql: 'CREATE INDEX IF NOT EXISTS idx_galleries_slug ON galleries(slug)' }).catch(() => {});
    await supabase.rpc('exec_sql', { sql: 'CREATE INDEX IF NOT EXISTS idx_photos_gallery_id ON photos(gallery_id)' }).catch(() => {});
    await supabase.rpc('exec_sql', { sql: 'CREATE INDEX IF NOT EXISTS idx_photos_display_order ON photos(gallery_id, display_order)' }).catch(() => {});

    // Create reorder function
    console.log('5. Creating reorder_photos function...');
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION reorder_photos(
          p_gallery_id UUID,
          p_photo_orders JSONB
        ) RETURNS VOID AS $$
        DECLARE
          order_item JSON;
        BEGIN
          FOR order_item IN SELECT * FROM jsonb_array_elements(p_photo_orders)
          LOOP
            UPDATE photos
            SET display_order = (order_item->>'display_order')::INTEGER,
                updated_at = NOW()
            WHERE id = (order_item->>'photo_id')::UUID
              AND gallery_id = p_gallery_id;
          END LOOP;
        END;
        $$ LANGUAGE plpgsql;
      `
    }).catch(() => {});

    // Insert sample data
    console.log('6. Inserting sample data...');
    await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO galleries (id, title, slug, description, is_published, is_active)
        VALUES 
          ('11111111-1111-1111-1111-111111111111', 'Varanasi', 'varanasi', 'A visual journey through the ghats', true, true),
          ('22222222-2222-2222-2222-222222222222', 'Masai Mara', 'masai-mara', 'Wildlife encounters', true, true)
        ON CONFLICT (id) DO NOTHING
      `
    }).catch(() => {});

    console.log('\n✅ Database setup complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Create a storage bucket named "galleries" (public)');
    console.log('   2. Refresh your browser to see the data');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.log('\n📝 Alternative: Run the SQL manually in Supabase Dashboard');
  }
}

setupDatabase();
