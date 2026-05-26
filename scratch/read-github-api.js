async function readReadme() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/Youtube-Transcript-Dev/Youtube-Transcript-API/main/README.md');
    if (!res.ok) {
      const res2 = await fetch('https://raw.githubusercontent.com/Youtube-Transcript-Dev/Youtube-Transcript-API/master/README.md');
      const text = await res2.text();
      console.log(text.slice(0, 3000));
    } else {
      const text = await res.text();
      console.log(text.slice(0, 3000));
    }
  } catch (err) {
    console.error(err);
  }
}
readReadme();
