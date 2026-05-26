async function testRickroll() {
  const videoId = 'dQw4w9WgXcQ';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    console.log('Fetching Rickroll watch page...');
    const res = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const startToken = 'var ytInitialPlayerResponse = ';
    const startIndex = html.indexOf(startToken);
    if (startIndex === -1) {
      console.log('No player response found');
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
    
    if (captionTracks && captionTracks.length > 0) {
      const baseUrl = captionTracks[0].baseUrl;
      console.log('Caption URL:', baseUrl);
      
      console.log('Fetching directly...');
      const dRes = await fetch(baseUrl);
      console.log('Direct status:', dRes.status, 'len:', (await dRes.text()).length);
      
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(baseUrl)}`;
      console.log('Fetching via Allorigins Raw...');
      const pRes = await fetch(proxyUrl);
      console.log('Proxy status:', pRes.status, 'len:', (await pRes.text()).length);
    }
  } catch (err) {
    console.error(err);
  }
}
testRickroll();
