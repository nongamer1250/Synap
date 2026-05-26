async function testDesktop() {
  const videoId = 'JP7ITIXGpHk';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const proxyWatchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(watchUrl)}`;
  
  try {
    console.log('Testing Desktop UA via Allorigins Raw...');
    const res = await fetch(proxyWatchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('  Status:', res.status, res.statusText);
    const html = await res.text();
    console.log('  HTML length:', html.length);
    
    const startToken = 'var ytInitialPlayerResponse = ';
    const startIndex = html.indexOf(startToken);
    if (startIndex === -1) {
      console.log('  ytInitialPlayerResponse not found');
      return;
    }
    
    const jsonStart = startIndex + startToken.length;
    let depth = 0;
    let jsonStr = '';
    for (let i = jsonStart; i < html.length; i++) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') {
        depth--;
        if (depth === 0) {
          jsonStr = html.slice(jsonStart, i + 1);
          break;
        }
      }
    }
    
    if (!jsonStr) {
      console.log('  Failed to parse JSON boundaries');
      return;
    }
    
    const playerResponse = JSON.parse(jsonStr);
    console.log('  playabilityStatus:', playerResponse.playabilityStatus?.status);
    console.log('  captions exists:', playerResponse.captions ? 'Yes' : 'No');
    if (playerResponse.captions) {
      const tracks = playerResponse.captions.playerCaptionsTracklistRenderer?.captionTracks;
      console.log('  captionTracks:', tracks);
    }
  } catch (err) {
    console.error('  Error:', err.message);
  }
}

testDesktop();
