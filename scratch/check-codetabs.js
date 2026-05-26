async function checkCodetabs() {
  const videoId = 'JP7ITIXGpHk';
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(watchUrl)}`;
  try {
    const res = await fetch(proxyUrl);
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Length:', text.length);
    console.log('Body:', text.slice(0, 1000));
  } catch (err) {
    console.error(err);
  }
}
checkCodetabs();
