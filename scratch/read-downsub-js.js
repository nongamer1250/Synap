async function readDownsubJS() {
  try {
    const res = await fetch('https://downsub.com');
    const text = await res.text();
    const regex = /src="([^"]+\.js)"/g;
    let match;
    const jsUrls = [];
    while ((match = regex.exec(text)) !== null) {
      jsUrls.push(match[1]);
    }
    console.log('JS script tags:', jsUrls);
    
    for (let jsUrl of jsUrls) {
      if (!jsUrl.startsWith('http')) {
        jsUrl = 'https://downsub.com' + (jsUrl.startsWith('/') ? '' : '/') + jsUrl;
      }
      console.log('Fetching JS:', jsUrl);
      const jsRes = await fetch(jsUrl);
      const jsText = await jsRes.text();
      console.log('  Length:', jsText.length);
      
      // Look for API endpoints
      const apiRegex = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[a-zA-Z0-9_./%-]*/g;
      let apiMatch;
      const found = new Set();
      while ((apiMatch = apiRegex.exec(jsText)) !== null) {
        const path = apiMatch[0];
        if (path.includes('downsub') || path.includes('api') || path.includes('sub')) {
          found.add(path);
        }
      }
      console.log('  Found endpoints:', Array.from(found).slice(0, 10));
    }
  } catch (err) {
    console.error(err);
  }
}
readDownsubJS();
