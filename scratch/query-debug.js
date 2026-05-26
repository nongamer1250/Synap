async function query() {
  const url = 'https://www.synap.bond/api/youtube-debug?v=JP7ITIXGpHk';
  try {
    console.log('Querying production youtube-debug endpoint...');
    const res = await fetch(url);
    console.log('Status:', res.status, res.statusText);
    const json = await res.json();
    console.log('JSON Output:\n', JSON.stringify(json, null, 2));
  } catch (err) {
    console.error(err);
  }
}
query();
