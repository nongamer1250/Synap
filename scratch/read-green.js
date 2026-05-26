async function readPage() {
  try {
    const res = await fetch('https://youtube-transcript-green.vercel.app');
    const text = await res.text();
    console.log('Page length:', text.length);
    // Find script tags or links or API calls
    const regex = /src="([^"]+)"/g;
    let match;
    console.log("Script tags:");
    while ((match = regex.exec(text)) !== null) {
      console.log(match[1]);
    }
  } catch (err) {
    console.error(err);
  }
}
readPage();
