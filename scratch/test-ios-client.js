async function testIOS() {
  const videoId = 'JP7ITIXGpHk';
  const url = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
  
  const payload = {
    context: {
      client: {
        clientName: 'IOS',
        clientVersion: '19.29.1',
        deviceModel: 'iPhone14,3',
        osName: 'iPhone',
        osVersion: '17.5.1'
      }
    },
    videoId: videoId
  };
  
  try {
    console.log('Testing IOS client via InnerTube API...');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'com.google.ios.youtube/19.29.1 (iPhone14,3; U; CPU iPhone OS 17_5_1 like Mac OS X; en_US)'
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

testIOS();
