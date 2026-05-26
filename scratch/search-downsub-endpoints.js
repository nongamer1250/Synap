async function searchEndpoints() {
  try {
    const url = 'https://downsub.com/js/main.ebd2f4f76a495f9f9431.js';
    console.log('Fetching:', url);
    const res = await fetch(url);
    const text = await res.text();
    
    // Look for routes or API calls in the JS
    const regex = /"\/[^"]+"|'\/[^']+'/g;
    let match;
    const paths = new Set();
    while ((match = regex.exec(text)) !== null) {
      const path = match[0].slice(1, -1);
      if (path.includes('ajax') || path.includes('download') || path.includes('sub') || path.includes('api') || path.includes('ext')) {
        paths.add(path);
      }
    }
    console.log('Paths found:', Array.from(paths));
  } catch (err) {
    console.error(err);
  }
}
searchEndpoints();
