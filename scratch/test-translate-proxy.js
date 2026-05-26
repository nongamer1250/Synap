async function testTranslateProxy() {
  const videoId = 'JP7ITIXGpHk';
  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const translateUrl = `https://translate.google.com/translate?sl=en&tl=es&u=${encodeURIComponent(targetUrl)}`;
  
  try {
    console.log('Fetching watch page via Google Translate proxy...');
    const res = await fetch(translateUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log('Status:', res.status, res.statusText);
    const html = await res.text();
    console.log('HTML length:', html.length);
    
    // Check if the HTML contains mentions of YouTube or the video ID
    console.log('Contains "youtube.com":', html.includes('youtube.com'));
    console.log('Contains videoId:', html.includes(videoId));
    
    // Write HTML to debug
    const fs = require('fs');
    fs.writeFileSync('scratch/translate-proxy.html', html);
    console.log('Wrote translate-proxy.html');
  } catch (err) {
    console.error('Error:', err);
  }
}

testTranslateProxy();
