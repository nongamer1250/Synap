async function readPage() {
  try {
    const res = await fetch('https://youtubetranscript.com');
    const text = await res.text();
    console.log('Page length:', text.length);
    // Search for API endpoints, script URLs, or fetch calls
    const regex = /fetch|api|getTranscript|server/gi;
    let match;
    console.log("Matches of interest:");
    while ((match = regex.exec(text)) !== null) {
      console.log(text.slice(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100)));
      console.log("---");
    }
  } catch (err) {
    console.error(err);
  }
}
readPage();
