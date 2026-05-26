async function readVcyon() {
  try {
    const res = await fetch('https://vcyon.com');
    const text = await res.text();
    console.log('Page length:', text.length);
    // Find headings, code blocks, or links
    const regex = /<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>|<pre[^>]*>([\s\S]*?)<\/pre>|https?:\/\/[^\s"'`>]+/gi;
    let match;
    const urls = [];
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        console.log('Heading:', match[1].replace(/<[^>]+>/g, '').trim());
      } else if (match[2]) {
        console.log('Code Block:', match[2].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
      } else {
        const url = match[0];
        if (url.includes('api') || url.includes('transcript')) {
          urls.push(url);
        }
      }
    }
    console.log('URLs of interest:', urls.slice(0, 30));
  } catch (err) {
    console.error(err);
  }
}
readVcyon();
