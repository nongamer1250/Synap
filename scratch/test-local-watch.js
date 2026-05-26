const fs = require('fs');

async function testLocal() {
  const videoId = 'JP7ITIXGpHk';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    console.log('Fetching local watch page directly (no proxy)...');
    const res = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    console.log('HTML length:', html.length);
    
    const startToken = 'var ytInitialPlayerResponse = ';
    const startIndex = html.indexOf(startToken);
    if (startIndex === -1) {
      console.log('Could not find ytInitialPlayerResponse');
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
    
    const playerResponse = JSON.parse(jsonStr);
    const captionTracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    console.log('Local captions exists:', playerResponse.captions ? 'Yes' : 'No');
    if (captionTracks && captionTracks.length > 0) {
      const baseUrl = captionTracks[0].baseUrl;
      console.log('Local caption track URL:', baseUrl);
      console.log('Fetching local timedtext directly from same machine...');
      const timedtextRes = await fetch(baseUrl);
      console.log('Timedtext status:', timedtextRes.status, timedtextRes.statusText);
      const xml = await timedtextRes.text();
      console.log('XML length:', xml.length);
      console.log('Preview:', xml.slice(0, 300));
    }
  } catch (err) {
    console.error(err);
  }
}
testLocal();
