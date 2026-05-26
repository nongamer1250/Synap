async function testTranslateEn() {
  const videoId = 'JP7ITIXGpHk';
  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const translateUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(targetUrl)}`;
  
  try {
    console.log('Fetching watch page via Google Translate (sl=en, tl=en)...');
    const res = await fetch(translateUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log('Status:', res.status, res.statusText);
    const html = await res.text();
    console.log('HTML length:', html.length);
    console.log('Contains ytInitialPlayerResponse:', html.includes('ytInitialPlayerResponse'));
    console.log('Contains playerCaptionsTracklistRenderer:', html.includes('playerCaptionsTracklistRenderer'));
  } catch (err) {
    console.error('Error:', err);
  }
}

testTranslateEn();
