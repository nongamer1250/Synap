async function readDevTo() {
  try {
    const res = await fetch('https://dev.to/geiger01/best-youtube-transcript-apis-in-2025-45d6');
    const text = await res.text();
    console.log('Page length:', text.length);
    // Find headings or list items or paragraphs mentioning free or API URLs
    const regex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>|<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>|https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/[a-zA-Z0-9_./%-]*/gi;
    let match;
    const found = new Set();
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        console.log('Heading:', match[1].replace(/<[^>]+>/g, '').trim());
      } else if (match[2]) {
        const url = match[2];
        if (url.includes('api') || url.includes('github') || url.includes('transcript')) {
          found.add(url);
        }
      } else {
        const url = match[0];
        if (url.includes('api') || url.includes('github') || url.includes('transcript')) {
          found.add(url);
        }
      }
    }
    console.log('Found URLs of interest:', Array.from(found).slice(0, 30));
  } catch (err) {
    console.error(err);
  }
}
readDevTo();
