const fs = require('fs');
const html = fs.readFileSync('backend-comprehensive.html', 'utf-8');
const hrefs = [...html.matchAll(/href="#([^"]+)"/g)].map(m => m[1]);
const ids = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const missing = hrefs.filter(h => !ids.includes(h));
console.log('TOC links:', hrefs.length, '| Heading IDs:', ids.length);
if (missing.length > 0) {
  console.log('BROKEN LINKS:', missing.join(', '));
} else {
  console.log('ALL LINKS OK - every TOC href has a matching heading id');
}
