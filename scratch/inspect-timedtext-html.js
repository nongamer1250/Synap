const fs = require('fs');
const html = fs.readFileSync('scratch/timedtext-proxy.html', 'utf8');

console.log('Includes "synap":', html.toLowerCase().includes('synap'));
console.log('Includes "david":', html.toLowerCase().includes('david'));
console.log('Includes "cs50":', html.toLowerCase().includes('cs50'));
console.log('Includes "study":', html.toLowerCase().includes('study'));
