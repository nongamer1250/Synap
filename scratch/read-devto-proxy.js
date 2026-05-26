async function readDevTo() {
  try {
    const res = await fetch('https://dev.to/thanhphuchuynh/youtubes-transcript-feature-with-proxy-5hm5');
    const text = await res.text();
    console.log('Dev.to page length:', text.length);
    // Find all headings or external links in the text
    const regex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>|<code[^>]*>([\s\S]*?)<\/code>/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        console.log('Heading:', match[1].replace(/<[^>]+>/g, '').trim());
      } else {
        const code = match[2].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        if (code.includes('fetch') || code.includes('YoutubeTranscript') || code.includes('proxy')) {
          console.log('Code Block:\n', code.slice(0, 1000));
          console.log('---');
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}
readDevTo();
