async function readPackage() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/henglyrepo/youtube-transcript/main/package.json');
    if (!res.ok) {
      console.error('Failed to fetch package.json');
      return;
    }
    const text = await res.text();
    console.log(text);
  } catch (err) {
    console.error(err);
  }
}
readPackage();
