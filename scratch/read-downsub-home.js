async function readDownsub() {
  try {
    const res = await fetch('https://downsub.com');
    const text = await res.text();
    console.log('Page length:', text.length);
    // Find headings, code blocks, or links
    const regex = /<script[^>]*>([\s\S]*?)<\/script>|https?:\/\/[^\s"'`>]+/gi;
    let match;
    const urls = [];
    while ((match = regex.exec(text)) !== null) {
      if (match[1]) {
        const code = match[1];
        if (code.includes('fetch') || code.includes('url') || code.includes('api')) {
          console.log('Script snippet of interest:\n', code.slice(0, 1000));
        }
      } else {
        const url = match[0];
        if (url.includes('api') || url.includes('sub') || url.includes('down')) {
          urls.push(url);
        }
      }
    }
    console.log('URLs of interest:', urls.slice(0, 30));
  } catch (err) {
    console.error(err);
  }
}

readDownsub();
