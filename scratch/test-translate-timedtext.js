async function testTranslateTimedtext() {
  const videoId = 'JP7ITIXGpHk';
  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const translateUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(targetUrl)}`;
  
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
    
    // Fetch timedtext via Google Translate proxy
    const timedtextProxyUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(baseUrl)}`;
    console.log('Fetching timedtext via Google Translate:', timedtextProxyUrl);
    const timedtextRes = await fetch(timedtextProxyUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    const timedtextHtml = await timedtextRes.text();
    console.log('Timedtext HTML length:', timedtextHtml.length);
    
    // Check if it contains the XML tags like <transcript> or <text>
    console.log('Contains <transcript>:', timedtextHtml.includes('<transcript>') || timedtextHtml.includes('&lt;transcript&gt;'));
    console.log('Contains <text>:', timedtextHtml.includes('<text ') || timedtextHtml.includes('&lt;text '));
    console.log('Contains <timedtext>:', timedtextHtml.includes('<timedtext') || timedtextHtml.includes('&lt;timedtext'));
    console.log('Contains <p> or <p >:', timedtextHtml.includes('<p ') || timedtextHtml.includes('&lt;p '));
    
    const fs = require('fs');
    fs.writeFileSync('scratch/timedtext-proxy.html', timedtextHtml);
    console.log('Wrote timedtext-proxy.html');
  } catch (err) {
    console.error('Error:', err);
  }
}

testTranslateTimedtext();
