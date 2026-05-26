async function readReadme() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/henglyrepo/youtube-transcript/main/README.md');
    if (!res.ok) {
      console.error('Failed to fetch README');
      return;
    }
    const text = await res.text();
    console.log(text.slice(0, 3000));
  } catch (err) {
    console.error(err);
  }
}
readReadme();
