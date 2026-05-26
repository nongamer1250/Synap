async function readDevTo() {
  try {
    const res = await fetch('https://dev.to/geiger01/best-youtube-transcript-apis-in-2025-45d6');
    const text = await res.text();
    console.log('Dev.to page length:', text.length);
    // Find all headings or external links in the text
    const regex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>|<a href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        console.log('Heading:', match[1].replace(/<[^>]+>/g, '').trim());
      } else {
        const url = match[2];
        const linkText = match[3].trim();
        if (url.includes('http') && !url.includes('dev.to') && linkText.length > 2) {
          console.log(`Link: ${linkText} -> ${url}`);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}
readDevTo();
