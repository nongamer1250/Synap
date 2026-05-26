async function testCodetabs() {
  const videoId = 'dQw4w9WgXcQ';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  try {
    const res = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const startToken = 'var ytInitialPlayerResponse = ';
    const startIndex = html.indexOf(startToken);
    if (startIndex === -1) return;
    
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
      
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(baseUrl)}`;
      console.log('Fetching timedtext via Codetabs proxy:', proxyUrl);
      const pRes = await fetch(proxyUrl);
      console.log('Codetabs status:', pRes.status, pRes.statusText);
      const xml = await pRes.text();
      console.log('XML length:', xml.length);
      if (xml.length > 0) {
        console.log('Preview:', xml.slice(0, 300));
      }
    }
  } catch (err) {
    console.error(err);
  }
}
testCodetabs();
