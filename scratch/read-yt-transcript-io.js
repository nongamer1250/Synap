async function readPage() {
  try {
    const res = await fetch('https://www.youtube-transcript.io/api');
    console.log('API page status:', res.status);
    const text = await res.text();
    console.log('API page length:', text.length);
    // Find references to POST or endpoints
    const regex = /POST\s+\/\w+|curl|http/gi;
    let match;
    console.log("Matches of POST/curl/http:");
    while ((match = regex.exec(text)) !== null) {
      console.log(text.slice(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100)));
      console.log("---");
    }
  } catch (err) {
    console.error(err);
  }
}
readPage();
