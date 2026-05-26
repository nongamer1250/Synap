async function testVcyonTranscript() {
  const videoId = 'JP7ITIXGpHk';
  const url = `https://api.vcyon.com/v1/youtube/transcript?videoId=${videoId}`;
  try {
    console.log('Fetching from vcyon transcript API:', url);
    const res = await fetch(url);
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Length:', text.length);
    try {
      const json = JSON.parse(text);
      console.log('JSON keys:', Object.keys(json));
      if (json.success) {
        console.log('Data count:', json.data?.length);
        console.log('Snippet:', json.data?.slice(0, 3).map((item) => item.text));
      } else {
        console.log('Error output:', json);
      }
    } catch {
      console.log('Non-JSON response:', text.slice(0, 500));
    }
  } catch (err) {
    console.error('Error fetching from vcyon:', err);
  }
}

testVcyonTranscript();
