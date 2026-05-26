async function testProductionReady() {
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
    
    // Fetch via Allorigins Raw
    console.log('2. Fetching timedtext via Allorigins Raw...');
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`;
    const proxyRes = await fetch(proxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!proxyRes.ok) {
      throw new Error(`Proxy timedtext fetch failed: ${proxyRes.status} ${proxyRes.statusText}`);
    }
    
    const xml = await proxyRes.text();
    console.log('XML length:', xml.length);
    
    // Parse XML
    const results = [];
    const classicRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
    let match;
    const matches = [...xml.matchAll(classicRegex)];
    results.push(...matches.map(m => m[3]));
    
    if (results.length === 0) {
      const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
      while ((match = pRegex.exec(xml)) !== null) {
        let text = match[3].replace(/<[^>]+>/g, '').trim();
        if (text) results.push(text);
      }
    }
    
    const fullText = results.join(' ')
      .replace(/&amp;/g, '&')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
      
    console.log('SUCCESS!');
    console.log('Transcript snippet:', fullText.slice(0, 300));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testProductionReady();
