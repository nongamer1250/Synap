const fs = require('fs');
const html = fs.readFileSync('scratch/timedtext-proxy.html', 'utf8');

const bodyIdx = html.indexOf('<body');
if (bodyIdx !== -1) {
  console.log('Body content:\n', html.slice(bodyIdx, bodyIdx + 2000));
} else {
  console.log('No body found. Printing ending of file:\n', html.slice(-2000));
}
