async function testProxies() {
  const videoId = 'JP7ITIXGpHk';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  const proxies = [
    `https://corsproxy.io/?url=${encodeURIComponent(watchUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(watchUrl)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(watchUrl)}`
  ];
  
  for (const proxy of proxies) {
    try {
      console.log('Testing proxy:', proxy);
      const res = await fetch(proxy);
      console.log('  Status:', res.status);
      const text = await res.text();
      console.log('  Text length:', text.length);
      if (res.ok && text.length > 5000) {
        // Check if it contains ytInitialPlayerResponse
        const hasJson = text.includes('ytInitialPlayerResponse');
        console.log('  Contains ytInitialPlayerResponse:', hasJson);
        if (hasJson) {
          console.log('  SUCCESS!');
          break;
        }
      }
    } catch (e) {
      console.warn('  Error:', e.message);
    }
  }
}

testProxies();
