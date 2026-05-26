async function testTV() {
  const videoId = 'JP7ITIXGpHk';
  const url = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
  
  const payload = {
    context: {
      client: {
        clientName: 'TVHTML5',
        clientVersion: '7.20240524.01.00',
        clientScreen: 'WATCH'
      }
    },
    videoId: videoId
  };
  
  try {
    console.log('Testing TVHTML5 client via InnerTube API...');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Chromecast; U; Cobalt/23.LTS.4.402685044-gold; en-US) Gecko/20100101 Firefox/90.0 Cobalt/Version',
        'Referer': 'https://www.youtube.com/tv'
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

testTV();
