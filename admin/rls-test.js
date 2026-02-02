/**
 * Supabase RLS Diagnostic - Run in browser console
 */
(async function(){
  const URL = 'https://erhvmlxdcplrhmmuboxo.supabase.co';
  const KEY = 'sb_publishable_Lt7xsPkx9HGvh_udcekpxw_CmnP_zI4';
  
  console.clear();
  console.log('%c🔍 Supabase RLS Diagnostic', 'font-size:16px;color:#0066FF');
  
  // Test 1: Check if we can reach Supabase at all
  console.log('\n1. Testing basic reachability...');
  const test1 = await fetch(URL + '/rest/v1/', {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  });
  console.log('   Basic reachability:', test1.status);
  
  // Test 2: Try galleries table
  console.log('\n2. Testing galleries table...');
  const test2 = await fetch(URL + '/rest/v1/galleries?select=id', {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  });
  console.log('   Status:', test2.status, test2.statusText);
  const data2 = await test2.json().catch(() => null);
  console.log('   Response:', data2);
  
  // Test 3: Check RLS status
  console.log('\n3. Checking RLS policies...');
  const test3 = await fetch(URL + '/rest/v1/galleries?select=rlp&limit=1', {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` }
  });
  console.log('   RLS check status:', test3.status);
  
  if (test2.status === 425) {
    console.log('\n⚠️  RLS is blocking! Need to either:');
    console.log('   1. Disable RLS on galleries table');
    console.log('   2. Create a policy for anon read access');
    console.log('   3. Use service role key');
  }
  
  // Test 4: Try with explicit headers
  console.log('\n4. Trying with explicit Content-Range...');
  const test4 = await fetch(URL + '/rest/v1/galleries?select=*', {
    method: 'GET',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Profile': 'public',
    }
  });
  console.log('   Status:', test4.status);
  const data4 = await test4.json().catch(() => null);
  console.log('   Data:', data4);
  
  console.log('\n🏁 Check results above. If you see 425 or 403, RLS is blocking access.');
})();
