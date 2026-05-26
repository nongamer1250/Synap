async function searchRefined() {
  try {
    const url = 'https://downsub.com/js/main.ebd2f4f76a495f9f9431.js';
    console.log('Fetching:', url);
    const res = await fetch(url);
    const text = await res.text();
    
    // Look for string literals that start with /
    const regex = /"[a-zA-Z0-9_\-/]{3,50}"|'[a-zA-Z0-9_\-/]{3,50}'/g;
    let match;
    const paths = new Set();
    while ((match = regex.exec(text)) !== null) {
      const path = match[0].slice(1, -1);
      if (path.startsWith('/') && (path.includes('ajax') || path.includes('download') || path.includes('sub') || path.includes('api') || path.includes('extract'))) {
        paths.add(path);
      }
    }
    console.log('Refined Paths found:', Array.from(paths));
  } catch (err) {
    console.error(err);
  }
}
searchRefined();
