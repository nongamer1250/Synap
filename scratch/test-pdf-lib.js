const pdf = require('pdf-parse/lib/pdf-parse.js');

console.log('Direct PDF parser function:', pdf);

try {
  const dummyBuffer = Buffer.from('%PDF-1.4 ... dummy data ...');
  // Just testing if the module loads and calls without crashing on initialization
  console.log('Successfully loaded pdf-parse direct file.');
} catch (err) {
  console.log('Error:', err.message);
}
