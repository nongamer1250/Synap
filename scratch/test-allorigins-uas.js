async function testUAs() {
  const videoId = 'JP7ITIXGpHk';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const proxyWatchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(watchUrl)}`;
  
  const uas = [
    { name: 'Default/None', headers: {} },
    { name: 'iPhone Safari (Mobile)', headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' } },
    { name: 'Android Chrome (Mobile)', headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36' } },
    { name: 'Googlebot', headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' } }
  ];
  
  for (const ua of uas) {
    try {
      console.log(`Testing UA [${ua.name}] via Allorigins Raw...`);
      const res = await fetch(proxyWatchUrl, { headers: ua.headers });
      console.log('  Status:', res.status, res.statusText);
      const html = await res.text();
      console.log('  HTML length:', html.length);
      
      const startToken = 'var ytInitialPlayerResponse = ';
      const startIndex = html.indexOf(startToken);
      if (startIndex === -1) {
        console.log('  ytInitialPlayerResponse not found');
        continue;
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
        continue;
      }
      
      const playerResponse = JSON.parse(jsonStr);
      console.log('  playabilityStatus:', playerResponse.playabilityStatus?.status);
      console.log('  captions exists:', playerResponse.captions ? 'Yes' : 'No');
      if (playerResponse.captions) {
        const tracks = playerResponse.captions.playerCaptionsTracklistRenderer?.captionTracks;
        console.log('  captionTracks length:', tracks ? tracks.length : 0);
      }
    } catch (err) {
      console.error('  Error:', err.message);
    }
  }
}

testUAs();
