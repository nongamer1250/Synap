async function fetchPage() {
  try {
    const res = await fetch('https://tubetext.vercel.app');
    const text = await res.text();
    
    // Find all occurrences of "api" or code blocks
    console.log("Length of page:", text.length);
    const regex = /GET|POST|\/api\/\w+/gi;
    let match;
    console.log("Matches of GET/POST/api:");
    while ((match = regex.exec(text)) !== null) {
      console.log(text.slice(Math.max(0, match.index - 50), Math.min(text.length, match.index + 100)));
      console.log("---");
    }
  } catch (err) {
    console.error(err);
  }
}
fetchPage();
