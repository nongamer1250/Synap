async function testEmbed() {
  const videoId = 'JP7ITIXGpHk';
  const url = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
  
  const clients = [
    {
      name: 'WEB_EMBED',
      payload: {
        context: {
          client: {
            clientName: 'WEB_EMBED',
            clientVersion: '0.0.1' // Or a version like '2.20240524.01.00'
          }
        },
        videoId: videoId
      }
    },
    {
      name: 'ANDROID_EMBED',
      payload: {
        context: {
          client: {
            clientName: 'ANDROID_EMBED',
            clientVersion: '1.0.0'
          }
        },
        videoId: videoId
      }
    }
  ];
  
  for (const c of clients) {
    try {
      console.log(`Testing client [${c.name}] via InnerTube API...`);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        body: JSON.stringify(c.payload)
      });
      console.log('  Status:', res.status, res.statusText);
      const data = await res.json();
      console.log('  PlayabilityStatus:', data.playabilityStatus?.status);
      console.log('  Captions exists:', data.captions ? 'Yes' : 'No');
    } catch (err) {
      console.error('  Error:', err.message);
    }
  }
}

testEmbed();
