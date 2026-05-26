async function testGoogRaw() {
  const videoId = 'JP7ITIXGpHk';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const translateUrl = `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(watchUrl)}`;
  
  try {
    console.log('Fetching watch page via Google Translate proxy...');
    const res = await fetch(translateUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const html = await res.text();
    const startToken = 'var ytInitialPlayerResponse = ';
    const startIndex = html.indexOf(startToken);
    if (startIndex === -1) throw new Error('No player response');
    
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
    const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks || captionTracks.length === 0) throw new Error('No caption tracks');
    
    let baseUrl = captionTracks[0].baseUrl;
    console.log('Original caption track URL:', baseUrl);
    
    // Rewrite baseUrl to use www-youtube-com.translate.goog
    const parsedUrl = new URL(baseUrl);
    const googProxyUrl = `https://www-youtube-com.translate.goog${parsedUrl.pathname}${parsedUrl.search}&_x_tr_sl=en&_x_tr_tl=es&_x_tr_hl=en`;
    console.log('Fetching timedtext via .translate.goog proxy URL:', googProxyUrl);
    
    const timedtextRes = await fetch(googProxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log('Status:', timedtextRes.status, timedtextRes.statusText);
    const xml = await timedtextRes.text();
    console.log('XML length:', xml.length);
    console.log('Snippet:', xml.slice(0, 1000));
    
  } catch (err) {
    console.error('Error:', err);
  }
}

testGoogRaw();
