async function testVcyon() {
  const videoId = 'JP7ITIXGpHk';
  const url = `https://api.vcyon.com/v1/youtube/video?videoId=${videoId}`;
  try {
    console.log('Fetching from vcyon API:', url);
    const res = await fetch(url);
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Length:', text.length);
    try {
      const json = JSON.parse(text);
      console.log('JSON keys:', Object.keys(json));
      if (json.transcript) {
        console.log('Transcript count:', json.transcript.length);
        console.log('First few transcript lines:', json.transcript.slice(0, 5));
      } else {
        console.log('Full JSON output:', json);
      }
    } catch {
      console.log('Non-JSON response:', text.slice(0, 1000));
    }
  } catch (err) {
    console.error('Error fetching from vcyon:', err);
  }
}

testVcyon();
