const fs = require('fs');

async function search() {
  const query = 'savesubs.com api endpoint extract payload OR post';
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) {
      console.error('DDG search failed:', res.status, res.statusText);
      return;
    }
    const html = await res.text();
    
    // Simple regex parsing of DDG results
    const results = [];
    const regex = /<a class="result__url"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const link = match[1].replace(/<[^>]+>/g, '').trim();
      const snippet = match[2].replace(/<[^>]+>/g, '').trim();
      results.push({ link, snippet });
    }
    
    console.log('Found results:', results.length);
    console.log(JSON.stringify(results.slice(0, 10), null, 2));
  } catch (err) {
    console.error('Search error:', err);
  }
}

search();
