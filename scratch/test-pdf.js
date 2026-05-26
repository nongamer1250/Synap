const { PDFParse } = require('pdf-parse');

console.log('PDFParse import:', PDFParse);

try {
  // Test constructor with empty buffer (should fail gracefully or throw a loading error)
  const dummyBuffer = Buffer.from('%PDF-1.4 ... dummy data ...');
  const parser = new PDFParse({ data: dummyBuffer });
  console.log('Successfully constructed PDFParse instance:', parser);
} catch (err) {
  console.log('Constructor error (expected for dummy data):', err.message);
}
