async function main() {
  try {
    const videoId = 'JP7ITIXGpHk';
    const urls = [
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr&fmt=srv3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv3`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&kind=asr`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`
    ];
    
    for (const url of urls) {
      console.log('Fetching:', url);
      const res = await fetch(url);
      console.log('  Status:', res.status);
      const text = await res.text();
      console.log('  Text length:', text.length);
      if (res.ok && text.length > 50) {
        console.log('  Preview:', text.substring(0, 300));
        break;
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
