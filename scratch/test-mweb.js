async function testMWEB() {
  const videoId = 'JP7ITIXGpHk';
  const url = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
  
  const payload = {
    context: {
      client: {
        clientName: 'MWEB',
        clientVersion: '2.20240524.01.00'
      }
    },
    videoId: videoId
  };
  
  try {
    console.log('Testing MWEB client via InnerTube API...');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('PlayabilityStatus:', data.playabilityStatus?.status);
    console.log('CaptionsExists:', data.captions ? 'Yes' : 'No');
    if (data.captions) {
      console.log('Tracks:', data.captions.playerCaptionsTracklistRenderer?.captionTracks);
    }
  } catch (err) {
    console.error(err);
  }
}
testMWEB();
