async function testEmbedPage() {
  const videoId = 'JP7ITIXGpHk';
  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
  
  try {
    console.log('Fetching local embed page directly (no proxy)...');
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    
    console.log('Status:', res.status, res.statusText);
    const html = await res.text();
    console.log('HTML length:', html.length);
    
    // Check if playerResponse is inside the embed page HTML
    // Embed pages usually put player response in yt.setConfig or ytInitialPlayerResponse
    const hasPlayerConfig = html.includes('ytInitialPlayerResponse') || html.includes('yt.setConfig') || html.includes('playerResponse');
    console.log('Contains player response keywords:', hasPlayerConfig);
    
    // Write HTML to debug
    const fs = require('fs');
    fs.writeFileSync('scratch/embed-page.html', html);
    console.log('Wrote embed-page.html');
  } catch (err) {
    console.error(err);
  }
}
testEmbedPage();
