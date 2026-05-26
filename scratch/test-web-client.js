async function testWeb() {
  const videoId = 'JP7ITIXGpHk';
  const url = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
  
  const payload = {
    context: {
      client: {
        clientName: 'WEB',
        clientVersion: '2.20240524.01.00'
      }
    },
    videoId: videoId
  };
  
  try {
    console.log('Testing WEB client via InnerTube API...');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('PlayabilityStatus:', data.playabilityStatus?.status);
    console.log('Captions block exists:', data.captions ? 'Yes' : 'No');
    if (data.captions) {
      const tracks = data.captions.playerCaptionsTracklistRenderer?.captionTracks;
      console.log('Caption tracks:', tracks);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testWeb();
