/**
 * Insert Photos Only - Run this after galleries exist
 * 
 * INSTRUCTIONS:
 * 1. Open browser console (F12 → Console)
 * 2. Copy and paste this block
 * 3. Press Enter
 */

(async function(){
  const URL = 'https://erhvmlxdcplrhmmuboxo.supabase.co';
  const KEY = 'sb_publishable_Lt7xsPkx9HGvh_udcekpxw_CmnP_zI4';
  
  console.clear();
  console.log('%c📷 Inserting Photos...', 'font-size:16px;color:#0066FF');
  
  const photos = [
    { id: 'a1111111-1111-1111-1111-111111111111', gallery_id: '22222222-2222-2222-2222-222222222222', image_url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800', alt_text: 'Lion in Serengeti', field_journal: 'Male lion resting in the afternoon heat, scanning the horizon for his pride.', display_order: 1, is_published: true, views: 1247, likes: 89, shares: 12 },
    { id: 'b2222222-2222-2222-2222-222222222222', gallery_id: '22222222-2222-2222-2222-222222222222', image_url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800', alt_text: 'Elephant family', field_journal: 'Matriarch leading herd to water hole during golden hour.', display_order: 2, is_published: true, views: 892, likes: 67, shares: 8 },
    { id: 'c3333333-3333-3333-3333-333333333333', gallery_id: '22222222-2222-2222-2222-222222222222', image_url: 'https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?w=800', alt_text: 'Zebra migration', field_journal: 'Zebras on the move during the Great Migration.', display_order: 3, is_published: true, views: 2103, likes: 156, shares: 34 }
  ];
  
  for (const p of photos) {
    try {
      const res = await fetch(`${URL}/rest/v1/photos`, {
        method: 'POST',
        headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
        body: JSON.stringify(p)
      });
      console.log(`✅ Photo ${p.display_order}: ${res.status}`);
    } catch (e) {
      console.log(`❌ Photo ${p.display_order}: ${e.message}`);
    }
  }
  
  // Verify
  const verify = await fetch(`${URL}/rest/v1/photos?gallery_id=eq.22222222-2222-2222-2222-222222222222`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  });
  const data = await verify.json();
  console.log(`\n🏁 Done! Found ${data.length} photos in Masai Mara gallery`);
  console.log('📝 Now refresh http://95.216.147.140:5173/ to see your photos!');
})();
