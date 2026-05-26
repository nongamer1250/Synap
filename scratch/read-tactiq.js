async function readPage() {
  try {
    const res = await fetch('https://tactiq.io/tools/youtube-transcript');
    const text = await res.text();
    console.log('Page length:', text.length);
    // Find script tags or links or API calls
    const regex = /src="([^"]+)"|href="([^"]+)"|https?:\/\/[^\s"'`>]+/g;
    let match;
    console.log("Urls found:");
    const urls = [];
    while ((match = regex.exec(text)) !== null) {
      const url = match[1] || match[2] || match[0];
      if (url.includes('api') || url.includes('js') || url.includes('transcript')) {
        urls.push(url);
      }
    }
    console.log(JSON.stringify(urls.slice(0, 30), null, 2));
  } catch (err) {
    console.error(err);
  }
}
readPage();
