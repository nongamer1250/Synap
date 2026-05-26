async function testNewProxies() {
  const videoId = 'JP7ITIXGpHk';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  const testCases = [
    { name: 'CORS.lol', url: `https://api.cors.lol/?url=${encodeURIComponent(watchUrl)}` },
    { name: 'CORS.dev', url: `https://proxy.cors.dev/?url=${encodeURIComponent(watchUrl)}` },
    { name: 'Cors-anywhere.com', url: `https://cors-anywhere.com/${watchUrl}` },
    { name: 'Cors-anywhere (via heroku)', url: `https://cors-anywhere.herokuapp.com/${watchUrl}` }
  ];
  
  for (const tc of testCases) {
    try {
      console.log(`Testing ${tc.name}:`, tc.url);
      const res = await fetch(tc.url, {
        headers: {
          'Origin': 'https://synap.bond',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      console.log('  Status:', res.status, res.statusText);
      const text = await res.text();
      console.log('  Length:', text.length);
      if (res.ok && text.length > 5000) {
        console.log('  Contains ytInitialPlayerResponse:', text.includes('ytInitialPlayerResponse'));
      }
    } catch (err) {
      console.error('  Error:', err.message);
    }
    console.log('---');
  }
}

testNewProxies();
