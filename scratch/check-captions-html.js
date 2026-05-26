const fs = require('fs');

async function check() {
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
    
    // Check if the word "captions" or "playerCaptionsTracklistRenderer" is in the HTML
    console.log('Contains "captions":', html.includes('"captions"'));
    console.log('Contains "playerCaptionsTracklistRenderer":', html.includes('playerCaptionsTracklistRenderer'));
    console.log('Contains "captionTracks":', html.includes('captionTracks'));
    
    // Find all occurrences of ytInitialPlayerResponse
    let pos = 0;
    while ((pos = html.indexOf('ytInitialPlayerResponse', pos)) !== -1) {
      console.log('Found ytInitialPlayerResponse at index:', pos);
      pos += 'ytInitialPlayerResponse'.length;
    }
    
  } catch (e) {
    console.error('Error:', e);
  }
}

check();
