async function readPage() {
  try {
    const res = await fetch('https://youtube-caption-extractor.vercel.app');
    const text = await res.text();
    console.log('Page length:', text.length);
    console.log(text.slice(0, 3000));
  } catch (err) {
    console.error(err);
  }
}
readPage();
