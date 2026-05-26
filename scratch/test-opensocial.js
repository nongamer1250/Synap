async function testOpensocial() {
  const videoId = 'JP7ITIXGpHk';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const proxyUrl = `https://images1-focus-opensocial.googleusercontent.com/gadgets/proxy?container=focus&refresh=604800&url=${encodeURIComponent(watchUrl)}`;
  
  try {
    console.log('Testing Google Opensocial Proxy:', proxyUrl);
    const res = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('  Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('  Length:', text.length);
    if (res.ok && text.length > 5000) {
      console.log('  Contains ytInitialPlayerResponse:', text.includes('ytInitialPlayerResponse'));
      console.log('  Contains LOGIN_REQUIRED:', text.includes('LOGIN_REQUIRED'));
    }
  } catch (err) {
    console.error('  Error:', err.message);
  }
}

testOpensocial();
