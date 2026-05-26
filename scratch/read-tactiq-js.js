async function readTactiqJS() {
  const jsUrls = [
    "https://cdn.prod.website-files.com/61120cb2509e011efcf0b1e4/js/tactiq.schunk.66eb774d91320c50.js",
    "https://cdn.prod.website-files.com/61120cb2509e011efcf0b1e4/js/tactiq.schunk.adfb32d903738542.js",
    "https://cdn.prod.website-files.com/61120cb2509e011efcf0b1e4/js/tactiq.3c1cd7c1.0a15ea4c81ecd98f.js"
  ];

  for (const url of jsUrls) {
    try {
      console.log('Fetching JS:', url);
      const res = await fetch(url);
      const text = await res.text();
      console.log('  Length:', text.length);
      
      // Let's search for fetch calls or endpoints starting with API
      const regex = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[a-zA-Z0-9_./%-]*/g;
      let match;
      const found = new Set();
      while ((match = regex.exec(text)) !== null) {
        const path = match[0];
        if (path.includes('tactiq') || path.includes('api') || path.includes('transcript')) {
          found.add(path);
        }
      }
      console.log('  Found URLs:', Array.from(found).slice(0, 20));
    } catch (err) {
      console.error(err);
    }
  }
}

readTactiqJS();
