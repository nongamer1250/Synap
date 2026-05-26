const { PDFParse } = require('pdf-parse/node');

console.log('PDFParse from node:', PDFParse);

try {
  const dummyBuffer = Buffer.from('%PDF-1.4 ... dummy data ...');
  const parser = new PDFParse({ data: dummyBuffer });
  console.log('Successfully constructed PDFParse instance:', parser);
} catch (err) {
  console.log('Constructor error (expected for dummy data):', err.message);
}
