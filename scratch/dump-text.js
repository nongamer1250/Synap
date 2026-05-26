const fs = require('fs');
const html = fs.readFileSync('scratch/timedtext-proxy.html', 'utf8');

// Strip script tags
const cleanHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
// Strip style tags
const cleanHtml2 = cleanHtml.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
// Strip all HTML tags
const text = cleanHtml2.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

console.log('Clean text length:', text.length);
console.log('First 2000 chars of clean text:\n', text.slice(0, 2000));
