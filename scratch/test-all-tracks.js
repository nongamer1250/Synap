const fs = require('fs');

async function testAllTracks() {
  const videoId = 'JP7ITIXGpHk';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    console.log('Fetching watch page...');
    const res = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    
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
    console.log('Available tracks:', captionTracks ? captionTracks.length : 0);
    
    if (captionTracks) {
      for (const track of captionTracks) {
        console.log(`Track: ${track.languageCode} (kind: ${track.kind || 'manual'}, name: ${track.name?.simpleText})`);
        console.log('  URL:', track.baseUrl);
        const timedtextRes = await fetch(track.baseUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        console.log('  Status:', timedtextRes.status, timedtextRes.statusText);
        const xml = await timedtextRes.text();
        console.log('  XML length:', xml.length);
        if (xml.length > 0) {
          console.log('  Preview:', xml.slice(0, 200));
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}
testAllTracks();
