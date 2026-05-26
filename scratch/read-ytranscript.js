async function readPage() {
  try {
    const res = await fetch('https://nadimtuhin.com/blog/ytranscript-how-it-works');
    const text = await res.text();
    console.log('Page length:', text.length);
    // Find headings or code blocks
    const regex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>|<pre[^>]*>([\s\S]*?)<\/pre>/gi;
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        console.log('Heading:', match[1].replace(/<[^>]+>/g, '').trim());
      } else {
        const code = match[2].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        if (code.includes('youtubei') || code.includes('timedtext') || code.includes('fetch') || code.includes('curl')) {
          console.log('Code Block:\n', code.slice(0, 1000));
          console.log('---');
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
}
readPage();
