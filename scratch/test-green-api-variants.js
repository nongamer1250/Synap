async function test() {
  const videoId = 'JP7ITIXGpHk';
  const url = 'https://youtube-transcript-green.vercel.app/api/transcript';
  
  const payloads = [
    { videoUrl: `https://www.youtube.com/watch?v=${videoId}` },
    { videoUrl: `https://www.youtube.com/watch?v=${videoId}`, format: 'text' },
    { videoUrl: `https://www.youtube.com/watch?v=${videoId}`, language: 'en-US', format: 'text' },
    { videoUrl: `https://www.youtube.com/watch?v=${videoId}`, language: 'en', format: 'text' }
  ];
  
  for (const payload of payloads) {
    try {
      console.log('Testing payload:', JSON.stringify(payload));
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      console.log('  Status:', res.status, res.statusText);
      const text = await res.text();
      console.log('  Response length:', text.length);
      try {
        const json = JSON.parse(text);
        if (json.success) {
          console.log('  SUCCESS! Title:', json.metadata?.title);
          console.log('  Snippet:', json.data?.slice(0, 200));
          break;
        } else {
          console.log('  Error JSON:', json);
        }
      } catch {
        console.log('  Response snippet:', text.slice(0, 200));
      }
    } catch (err) {
      console.error('  Error:', err);
    }
    console.log('---');
  }
}

test();
