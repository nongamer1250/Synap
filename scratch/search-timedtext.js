const fs = require('fs');
const html = fs.readFileSync('scratch/timedtext-proxy.html', 'utf8');

console.log('HTML start:\n', html.slice(0, 1000));
console.log('Contains "david":', html.includes('david'));
console.log('Contains "cs50":', html.includes('cs50'));

// Find any iframe URLs
const regex = /<iframe[^>]*src="([^"]+)"/gi;
let match;
while ((match = regex.exec(html)) !== null) {
  console.log('Iframe src:', match[1]);
}
