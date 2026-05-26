async function testMobile() {
  const videoId = 'JP7ITIXGpHk';
  const watchUrl = `https://m.youtube.com/watch?v=${videoId}`;
  const proxyWatchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(watchUrl)}`;
  
  try {
    console.log('Testing Mobile URL via Allorigins Raw...');
    const res = await fetch(proxyWatchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1'
      }
    });
    console.log('  Status:', res.status, res.statusText);
    const html = await res.text();
    console.log('  HTML length:', html.length);
    
    // Look for ytInitialPlayerResponse or ytInitialData
    const hasPlayerResponse = html.includes('ytInitialPlayerResponse');
    console.log('  Contains ytInitialPlayerResponse:', hasPlayerResponse);
    
    const hasInitialData = html.includes('ytInitialData');
    console.log('  Contains ytInitialData:', hasInitialData);
    
    // Check if the word captions is in the HTML
    console.log('  Contains "captions":', html.includes('"captions"'));
    console.log('  Contains "captionTracks":', html.includes('captionTracks'));
    
  } catch (err) {
    console.error('  Error:', err.message);
  }
}

testMobile();
