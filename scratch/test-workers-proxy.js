async function testWorkers() {
  const watchUrl = 'https://www.youtube.com/watch?v=JP7ITIXGpHk';
  const url = `https://test.cors.workers.dev/?${watchUrl}`;
  try {
    console.log('Testing Cloudflare Workers Proxy:', url);
    const res = await fetch(url);
    console.log('  Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('  Length:', text.length);
    if (res.ok && text.length > 5000) {
      console.log('  Contains ytInitialPlayerResponse:', text.includes('ytInitialPlayerResponse'));
    }
  } catch (err) {
    console.error('  Error:', err.message);
  }
}
testWorkers();
