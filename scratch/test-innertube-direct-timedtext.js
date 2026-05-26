async function testDirectTimedtext() {
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
    console.log('1. Calling InnerTube player endpoint directly...');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)'
      },
      body: JSON.stringify(payload)
    });
    
    if (!res.ok) {
      throw new Error(`InnerTube failed: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    const captionTracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    
    if (!captionTracks || captionTracks.length === 0) {
      throw new Error('No caption tracks in InnerTube response');
    }
    
    console.log('Caption tracks found:', captionTracks.map((t) => t.languageCode));
    const track = captionTracks.find((t) => t.languageCode?.startsWith('en')) || captionTracks[0];
    const baseUrl = track.baseUrl;
    console.log('Timedtext URL:', baseUrl);
    
    // Fetch directly
    console.log('2. Fetching timedtext directly (no proxy)...');
    const directRes = await fetch(baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log('Direct timedtext status:', directRes.status, directRes.statusText);
    const xml = await directRes.text();
    console.log('XML length:', xml.length);
    if (xml.length > 0) {
      console.log('XML snippet:', xml.slice(0, 500));
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testDirectTimedtext();
