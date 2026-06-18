import fs from 'fs';
import path from 'path';
import { criteria as criteriaData } from '../data/criteria';

// Try local WP.xlsx workbook, then legacy path, then fallback to criteria-only validation
const workbookPaths = [
  path.resolve(__dirname, '../../../WP.xlsx'),
  path.resolve(__dirname, '../../../../html/lib/supabase/workbook.json'),
];

let workbook: any = null;
let workbookPath = '';
for (const p of workbookPaths) {
  if (fs.existsSync(p)) { workbookPath = p; break; }
}

if (workbookPath && workbookPath.endsWith('.xlsx')) {
  console.log('XLSX workbook found at', workbookPath, '— skipping (use libxlsx to parse)');
  // Generate criteria-only mapping for verification
} else if (workbookPath) {
  workbook = JSON.parse(fs.readFileSync(workbookPath, 'utf8')) as any;
} else {
  console.log('No workbook file found — generating criteria-only mapping for self-validation');
}

const mapping: Record<string, number> = {};

if (workbook) {
  const sheet = workbook['Accessibility Assessment Scheme'] as any[];
  if (sheet) {
    for (const row of sheet) {
      const code = row['__EMPTY_13'] || row['__EMPTY_12'];
      const val = row['__EMPTY_16'] ?? row['__EMPTY_26'] ?? row['__EMPTY_41'] ?? row['__EMPTY_56'];
      if (typeof code === 'string' && typeof val === 'number') {
        const c = code.trim();
        if (/^[A-Z]{2}\d+/.test(c) || c.startsWith('EC')) {
          mapping[c] = val;
        }
      }
    }
  }
}

const eps = 1e-6;
const rows: string[] = [];
rows.push('| Code | criteria.value | workbook.value | status |');
rows.push('|---:|---:|---:|---|');

for (const c of (criteriaData as any[])) {
  const code = c.code;
  const critVal = Number(c.value || 0);
  const wbVal = mapping[code];
  let status = '';
  if (wbVal === undefined) {
    status = 'MISSING';
  } else if (Math.abs(critVal - wbVal) > eps) {
    status = `MISMATCH (Δ=${(critVal - wbVal).toFixed(6)})`;
  } else {
    status = 'OK';
  }
  rows.push(`| ${code} | ${critVal} | ${wbVal ?? '—'} | ${status} |`);
}

const mappingKeys = Object.keys(mapping).sort((a, b) => a.localeCompare(b, undefined, {numeric: true}));
const mappingRows: string[] = [];
mappingRows.push('| Code | workbook.value |');
mappingRows.push('|---:|---:|');
for (const k of mappingKeys) {
  mappingRows.push(`| ${k} | ${mapping[k]} |`);
}

const outParts: string[] = [];
outParts.push('# All workbook mapping entries');
outParts.push('');
outParts.push(...mappingRows);
outParts.push('');
outParts.push('## Comparison to criteria');
outParts.push('');
outParts.push(...rows);

const out = outParts.join('\n');
const outPath = path.resolve(__dirname, '../../workbook-mapping.md');
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote mapping report to', outPath);
console.log('Summary: total criteria=', (criteriaData as any[]).length, 'mapped entries=', Object.keys(mapping).length);

