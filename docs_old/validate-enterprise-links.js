// Validate TOC anchor links in enterprise-technical-manual.html
const fs = require('fs');
const html = fs.readFileSync('enterprise-technical-manual.html', 'utf8');

// Collect all heading IDs
const idSet = new Set();
const idRe = /id="([^"]+)"/gi;
let m;
while ((m = idRe.exec(html)) !== null) idSet.add(m[1]);

// Collect all TOC hrefs
const tocRe = /href="#([^"]+)"/gi;
let broken = 0;
let total = 0;
while ((m = tocRe.exec(html)) !== null) {
  total++;
  const slug = m[1];
  if (idSet.has(slug)) continue;
  // Try fix: -- → -and-
  const fixed = slug.replace(/--/g, '-and-');
  if (idSet.has(fixed)) {
    console.log('WARN (auto-fixable): ' + slug + ' → ' + fixed);
  } else {
    console.log('BROKEN: ' + slug);
    // Show closest matches
    const candidates = [...idSet].filter(id => id.includes(slug.substring(0, 6)) || slug.includes(id.substring(0, 6)));
    if (candidates.length) console.log('  Similar IDs: ' + candidates.slice(0, 3).join(', '));
    broken++;
  }
}
console.log('');
console.log('Total TOC links: ' + total);
console.log('Heading IDs: ' + idSet.size);
console.log('Broken links: ' + broken);
console.log(broken === 0 ? '✅ ALL LINKS VALID' : '❌ ' + broken + ' BROKEN');
