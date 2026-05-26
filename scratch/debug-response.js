const fs = require('fs');

async function debug() {
  const videoId = 'JP7ITIXGpHk';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const proxyWatchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(watchUrl)}`;
  
  try {
    const res = await fetch(proxyWatchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    if (!res.ok) {
      console.error('Fetch failed:', res.status, res.statusText);
      return;
    }
    
    const html = await res.text();
    console.log('HTML length:', html.length);
    
    const startToken = 'var ytInitialPlayerResponse = ';
    const startIndex = html.indexOf(startToken);
    if (startIndex === -1) {
      console.error('Could not find ytInitialPlayerResponse');
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
      console.error('Failed to parse boundaries');
      return;
    }
    
    const playerResponse = JSON.parse(jsonStr);
    console.log('playabilityStatus:', playerResponse.playabilityStatus);
    console.log('captions:', playerResponse.captions ? 'Exists' : 'Does not exist');
    if (playerResponse.captions) {
      console.log('playerCaptionsTracklistRenderer:', playerResponse.captions.playerCaptionsTracklistRenderer ? 'Exists' : 'Does not exist');
      if (playerResponse.captions.playerCaptionsTracklistRenderer) {
        console.log('captionTracks:', playerResponse.captions.playerCaptionsTracklistRenderer.captionTracks);
      }
    }
    
    fs.writeFileSync('scratch/playerResponse.json', JSON.stringify(playerResponse, null, 2));
    console.log('Wrote playerResponse.json to scratch/');
  } catch (e) {
    console.error('Error:', e);
  }
}

debug();
