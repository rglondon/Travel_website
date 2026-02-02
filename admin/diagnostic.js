/**
 * Henry Travel - Supabase Diagnostic (Console Version)
 * 
 * INSTRUCTIONS:
 * 1. Open browser console (F12 → Console)
 * 2. Copy this entire block
 * 3. Paste and press Enter
 */

(async function() {
  const URL = 'https://erhvmlxdcplrhmmuboxo.supabase.co';
  const KEY = 'sb_publishable_Lt7xsPkx9HGvh_udcekpxw_CmnP_zI4';

  console.clear();
  console.log('%c🔧 Henry Travel - Supabase Diagnostic', 'font-size: 16px; font-weight: bold; color: #0066FF;');
  console.log('URL:', URL);

  function log(msg, type = 'info') {
    const color = type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#666';
    console.log(`%c${msg}`, `color: ${color};`);
  }

  async function api(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };
    if (body) options.body = JSON.stringify(body);
    const res = await fetch(`${URL}${endpoint}`, options);
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  // Run diagnostic
  console.log('\n🔄 Testing connection...');
  const galleries = await api('/rest/v1/galleries?select=*');
  
  if (galleries.status === 200) {
    log('✅ Supabase connected!', 'success');
    
    if (galleries.data && galleries.data.length > 0) {
      console.table(galleries.data);
      log(`📁 Found ${galleries.data.length} galleries`, 'success');
      
      // Check photos
      const first = galleries.data[0];
      const photos = await api(`/rest/v1/photos?gallery_id=eq.${first.id}&select=*`);
      if (photos.data) {
        console.table(photos.data);
        log(`📷 Found ${photos.data.length} photos in "${first.title}"`, 'success');
      }
    } else {
      log('📭 No galleries found - inserting sample data...', 'error');
      
      // Insert galleries
      const galleriesToInsert = [
        { id: '11111111-1111-1111-1111-111111111111', title: 'Varanasi', slug: 'varanasi', description: 'A visual journey through the ghats', is_published: true, is_active: true },
        { id: '22222222-2222-2222-2222-222222222222', title: 'Masai Mara', slug: 'masai-mara', description: 'Wildlife encounters', is_published: true, is_active: true }
      ];
      
      for (const g of galleriesToInsert) {
        await api('/rest/v1/galleries', 'POST', g);
        log(`✅ Inserted gallery: ${g.title}`);
      }
      
      // Insert photos
      const photosToInsert = [
        { id: 'a1111111-1111-1111-1111-111111111111', gallery_id: '22222222-2222-2222-2222-222222222222', image_url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', alt_text: 'Lion in Serengeti', field_journal: 'Male lion resting in the afternoon heat.', display_order: 1, is_published: true, views: 1247, likes: 89, shares: 12 },
        { id: 'b2222222-2222-2222-2222-222222222222', gallery_id: '22222222-2222-2222-2222-222222222222', image_url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800', alt_text: 'Elephant family', field_journal: 'Matriarch leading herd.', display_order: 2, is_published: true, views: 892, likes: 67, shares: 8 },
        { id: 'c3333333-3333-3333-3333-333333333333', gallery_id: '22222222-2222-2222-2222-222222222222', image_url: 'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?w=800', alt_text: 'Zebra migration', field_journal: 'Zebras on the move.', display_order: 3, is_published: true, views: 2103, likes: 156, shares: 34 }
      ];
      
      for (const p of photosToInsert) {
        await api('/rest/v1/photos', 'POST', p);
        log(`✅ Inserted photo ${p.display_order}`);
      }
      
      console.log('\n✅ Data inserted! Now refresh the dashboard to see it!');
    }
  } else {
    log(`❌ Error: ${galleries.status}`, 'error');
    log(galleries.data);
  }

  console.log('\n🏁 Diagnostic complete. Refresh http://95.216.147.140:5173/ to see your data!');
})();
