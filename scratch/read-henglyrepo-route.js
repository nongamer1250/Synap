async function readRoute() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/henglyrepo/youtube-transcript/main/app/api/transcript/route.ts');
    if (!res.ok) {
      console.error('Failed to fetch route.ts status:', res.status);
      return;
    }
    const text = await res.text();
    // Search for fetchTranscriptWithProxy
    const regex = /async function fetchTranscriptWithProxy[\s\S]*?\n\}/g;
    const match = text.match(regex);
    if (match) {
      console.log('Match found:\n', match[0]);
    } else {
      console.log('Not found. Let\'s print occurrences of fetchTranscriptWithProxy');
      const lines = text.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('fetchTranscriptWithProxy')) {
          console.log(`${idx + 1}: ${line}`);
        }
      });
    }
  } catch (err) {
    console.error(err);
  }
}
readRoute();
