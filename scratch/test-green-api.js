async function test() {
  const videoId = 'dQw4w9WgXcQ';
  const url = 'https://youtube-transcript-green.vercel.app/api/transcript';
  try {
    console.log('Fetching from youtube-transcript-green API for Rickroll...');
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
        language: 'en',
        format: 'text'
      })
    });
    
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Response length:', text.length);
    try {
      const json = JSON.parse(text);
      console.log('Is success:', json.success);
      if (json.success) {
        console.log('Metadata title:', json.metadata?.title);
        console.log('Snippet:', json.data?.slice(0, 300));
      } else {
        console.log('Error JSON:', json);
      }
    } catch {
      console.log('Response text:', text.slice(0, 500));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
