const Fs = require('fs');
const pdf = require('../node_modules/pdf-parse/lib/pdf-parse.js');

async function main() {
  try {
    const dataBuffer = Fs.readFileSync('examples/sample-document.pdf');
    console.log('PDF file loaded. Size:', dataBuffer.length, 'bytes');
    
    const parsed = await pdf(dataBuffer);
    console.log('PDF parsed successfully!');
    console.log('Number of pages:', parsed.numpages);
    console.log('Text length:', parsed.text.length);
    console.log('Text content preview:\n', parsed.text.trim().substring(0, 500));
  } catch (err) {
    console.error('Error parsing PDF:', err);
  }
}

main();
