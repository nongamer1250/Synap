async function testYTT() {
  const videoId = 'dQw4w9WgXcQ';
  const url = `https://youtubetranscript.com/?server_vid2=${videoId}`;
  try {
    console.log('Fetching from youtubetranscript.com endpoint:', url);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log('Status:', res.status, res.statusText);
    const xml = await res.text();
    console.log('XML length:', xml.length);
    console.log('Snippet:', xml.slice(0, 500));
    
    // Parse XML
    const results = [];
    const classicRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
    let match;
    const matches = [...xml.matchAll(classicRegex)];
    results.push(...matches.map(m => m[3]));
    
    if (results.length > 0) {
      console.log('Successfully parsed classic format!');
      console.log('Text preview:', results.slice(0, 20).join(' '));
    } else {
      console.log('Failed to parse. It might be blocked.');
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testYTT();
