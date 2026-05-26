async function readDownsubMain() {
  try {
    const url = 'https://downsub.com/js/main.ebd2f4f76a495f9f9431.js';
    console.log('Fetching:', url);
    const res = await fetch(url);
    const text = await res.text();
    console.log('JS Length:', text.length);
    
    // Search for keywords
    const keywords = ['ajax', 'api', 'download', 'extract', 'youtube', 'url', 'get', 'post'];
    for (const kw of keywords) {
      const idx = text.indexOf(kw);
      if (idx !== -1) {
        console.log(`Keyword [${kw}] found! Context:`);
        console.log(text.slice(Math.max(0, idx - 50), Math.min(text.length, idx + 100)));
        console.log('---');
      }
    }
  } catch (err) {
    console.error(err);
  }
}

readDownsubMain();
