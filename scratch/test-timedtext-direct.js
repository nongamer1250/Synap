async function main() {
  try {
    const videoId = 'JP7ITIXGpHk';
    // Try different timedtext urls
    const urls = [
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`,
      `https://video.google.com/timedtext?lang=en&v=${videoId}`,
      `https://www.youtube.com/api/timedtext?v=${videoId}&type=list`,
      `https://video.google.com/timedtext?v=${videoId}&type=list`
    ];
    
    for (const url of urls) {
      console.log('Fetching:', url);
      const res = await fetch(url);
      console.log('  Status:', res.status);
      const text = await res.text();
      console.log('  Text length:', text.length);
      if (res.ok && text.length > 50) {
        console.log('  Preview:', text.substring(0, 200));
        break;
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
