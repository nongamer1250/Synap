const fs = require('fs');

async function checkTranslateHtml() {
  const videoId = 'JP7ITIXGpHk';
  const targetUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const translateUrl = `https://translate.google.com/translate?sl=auto&tl=en&u=${encodeURIComponent(targetUrl)}`;
  
  try {
    const res = await fetch(translateUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    console.log('HTML length:', html.length);
    console.log('Title:', html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
    console.log('Includes ytInitialPlayerResponse:', html.includes('ytInitialPlayerResponse'));
    console.log('Includes LOGIN_REQUIRED:', html.includes('LOGIN_REQUIRED'));
    console.log('Includes Consent/Captcha:', html.includes('consent') || html.includes('captcha') || html.includes('robot'));
    fs.writeFileSync('scratch/translate-watch.html', html);
    console.log('Wrote scratch/translate-watch.html');
  } catch (err) {
    console.error(err);
  }
}
checkTranslateHtml();
