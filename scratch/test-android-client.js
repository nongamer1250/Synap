async function testAndroid() {
  const videoId = 'JP7ITIXGpHk';
  const url = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
  
  const payload = {
    context: {
      client: {
        clientName: 'ANDROID',
        clientVersion: '20.10.38'
      }
    },
    videoId: videoId
  };
  
  try {
    console.log('Testing ANDROID client via InnerTube API...');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)'
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

testAndroid();
