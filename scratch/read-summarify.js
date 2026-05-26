async function readPage() {
  try {
    const res = await fetch('https://summarify.app/caption-downloader');
    const text = await res.text();
    console.log('Page length:', text.length);
    // Find all links or APIs
    const regex = /fetch|api|post|get|url/gi;
    let match;
    console.log("Matches:");
    while ((match = regex.exec(text)) !== null) {
      console.log(text.slice(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100)));
      console.log("---");
    }
  } catch (err) {
    console.error(err);
  }
}
readPage();
