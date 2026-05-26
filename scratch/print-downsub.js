async function main() {
  try {
    const res = await fetch('https://downsub.com');
    const text = await res.text();
    console.log(text);
  } catch (err) {
    console.error(err);
  }
}
main();
