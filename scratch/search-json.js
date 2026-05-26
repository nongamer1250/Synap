const fs = require('fs');
const json = fs.readFileSync('scratch/playerResponse.json', 'utf8');
console.log('Length of playerResponse.json:', json.length);
console.log('Includes "caption":', json.toLowerCase().includes('caption'));

// Search for where "caption" occurs
let pos = 0;
while ((pos = json.toLowerCase().indexOf('caption', pos)) !== -1) {
  console.log('Found "caption" at index:', pos, 'context:', json.slice(Math.max(0, pos - 50), pos + 100));
  pos += 'caption'.length;
}
