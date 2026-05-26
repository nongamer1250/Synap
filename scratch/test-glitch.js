async function testGlitch() {
  const videoId = 'JP7ITIXGpHk';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  const testCases = [
    { name: 'Universal CORS Proxy Glitch', url: `https://universal-cors-proxy.glitch.me/${watchUrl}` },
    { name: 'Proxy Sauce Glitch', url: `https://proxy-sauce.glitch.me/${watchUrl}` }
  ];
  
  for (const tc of testCases) {
    try {
      console.log(`Testing ${tc.name}:`, tc.url);
      const res = await fetch(tc.url);
      console.log('  Status:', res.status, res.statusText);
      const text = await res.text();
      console.log('  Length:', text.length);
      if (res.ok && text.length > 5000) {
        console.log('  Contains ytInitialPlayerResponse:', text.includes('ytInitialPlayerResponse'));
      }
    } catch (err) {
      console.error('  Error:', err.message);
    }
  }
}

testGlitch();
