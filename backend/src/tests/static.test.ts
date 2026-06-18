import fs from 'fs';
import path from 'path';

function grepFiles(dir: string, exts = ['.ts', '.js']) {
  const res: string[] = [];
  const items = fs.readdirSync(dir);
  for (const it of items) {
    const p = path.join(dir, it);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) res.push(...grepFiles(p, exts));
    else if (exts.includes(path.extname(p))) res.push(p);
  }
  return res;
}

async function run() {
  const src = path.join(__dirname, '..');
  const files = grepFiles(src);
  const bannedPatterns = [
    /0\.2,0\.2,0\.2,0\.2,0\.2/,
    /85,\s*60,\s*40/,
    /MAX_OBS\s*=\s*25/,
  ];

  let fail = false;
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    for (const p of bannedPatterns) {
      if (p.test(txt)) {
        console.error(`Forbidden pattern ${p} found in ${f}`);
        fail = true;
      }
    }
  }

  if (fail) process.exit(1);
  console.log('Static checks passed');
}

run().catch((err) => { console.error(err); process.exit(1); });
