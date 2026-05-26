const { PDFParse } = require('pdf-parse/dist/pdf-parse/cjs/index.cjs');

console.log('PDFParse from CJS:', PDFParse);

try {
  const dummyBuffer = Buffer.from('%PDF-1.4 ... dummy data ...');
  const parser = new PDFParse({ data: dummyBuffer });
  console.log('Successfully constructed PDFParse instance:', parser);
} catch (err) {
  console.log('Constructor error (expected for dummy data):', err.message);
}
