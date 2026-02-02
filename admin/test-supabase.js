/**
 * Supabase Direct Test
 * Run in browser console: copy-paste this entire block
 */

(function() {
  const URL = 'https://erhvmlxdcplrhmmuboxo.supabase.co';
  const KEY = 'sb_publishable_Lt7xsPkx9HGvh_udcekpxw_CmnP_zI4';
  
  console.clear();
  console.log('🧪 Starting Supabase Direct Test...');
  console.log('URL:', URL);
  console.log('Key:', KEY.substring(0, 20) + '...');
  
  async function runTest() {
    try {
      console.log('\n📡 Making request to Supabase...');
      
      const response = await fetch(
        URL + '/rest/v1/galleries?is_active=eq.true&select=*',
        {
          method: 'GET',
          headers: {
            'apikey': KEY,
            'Authorization': 'Bearer ' + KEY,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          }
        }
      );
      
      console.log('\n📊 Response Status:', response.status, response.statusText);
      console.log('📊 Response Headers:');
      [...response.headers.entries()].forEach(([k, v]) => console.log('  ' + k + ':', v));
      
      if (response.ok) {
        const data = await response.json();
        console.log('\n✅ SUCCESS! Found', data.length, 'galleries:');
        console.log(JSON.stringify(data, null, 2));
        return { success: true, data };
      } else {
        const error = await response.json();
        console.log('\n❌ ERROR:', error);
        return { success: false, error };
      }
    } catch (e) {
      console.log('\n💥 EXCEPTION:', e.message);
      return { success: false, error: e.message };
    }
  }
  
  // Run the test
  runTest().then(result => {
    console.log('\n🏁 Test complete:', result.success ? 'SUCCESS' : 'FAILED');
  });
})();
