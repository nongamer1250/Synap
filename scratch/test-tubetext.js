async function testTubetext() {
  const videoId = 'dQw4w9WgXcQ';
  const url = `https://tubetext.vercel.app/youtube/transcript?video_id=${videoId}`;
  try {
    console.log('Fetching from tubetext API for Rickroll:', url);
    const res = await fetch(url);
    console.log('Status:', res.status, res.statusText);
    const json = await res.json();
    console.log('Is success:', json.success);
    if (json.success) {
      console.log('Video Details:', json.data?.details);
      console.log('Full Text Snippet:', json.data?.full_text?.slice(0, 500));
    } else {
      console.log('Error output:', json);
    }
  } catch (err) {
    console.error('Error fetching from tubetext:', err);
  }
}

testTubetext();
