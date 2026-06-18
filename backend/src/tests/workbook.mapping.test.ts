import fs from 'fs';
import path from 'path';
import assert from 'assert';
import { criteria as criteriaData } from '../data/criteria';

// Try multiple paths for workbook.json
const workbookSearchPaths = [
  path.resolve(__dirname, '../../../../html/lib/supabase/workbook.json'),
  path.resolve(__dirname, '../../WP.xlsx'),
  path.resolve(process.cwd(), 'WP.xlsx'),
  path.resolve(process.cwd(), 'html/lib/supabase/workbook.json'),
];

let workbookPath = '';
for (const p of workbookSearchPaths) {
  if (fs.existsSync(p)) {
    workbookPath = p;
    break;
  }
}

if (!workbookPath) {
  console.warn('SKIPPED: workbook.json not found. This test requires the Excel workbook to be available.');
  console.warn('Searched paths:');
  workbookSearchPaths.forEach(p => console.warn(`  - ${p}`));
  console.warn('Run this test when the workbook is available, or use "npm run seed" to sync criteria from criteria.ts.');
  process.exit(0);  // Not a failure — just unavailable
}

console.log(`Loading workbook from: ${workbookPath}`);
const workbook = JSON.parse(fs.readFileSync(workbookPath, 'utf8')) as any;
const sheet = workbook['Accessibility Assessment Scheme'] as any[];
if (!sheet) throw new Error('Sheet "Accessibility Assessment Scheme" not found in workbook');

const mapping: Record<string, number> = {};
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

function run() {
  const keys = Object.keys(mapping).sort();
  console.log('Found workbook mapping keys:', keys.length);
  assert(keys.length === 63, `expected 63 mapping entries, found ${keys.length}`);

  const critByCode: Record<string, any> = {};
  for (const c of (criteriaData as any[])) critByCode[c.code] = c;

  let mismatches = 0;
  for (const k of keys) {
    const crit = critByCode[k];
    assert(crit, `criterion ${k} not found in criteria data`);
    const critVal = Number(crit.value || 0);
    const wbVal = mapping[k];
    if (Math.abs(critVal - wbVal) > 1e-6) {
      console.error(`MISMATCH ${k}: criteria=${critVal} workbook=${wbVal}`);
      mismatches++;
    }
  }

  if (mismatches > 0) {
    throw new Error(`Found ${mismatches} mismatches`);
  }

  console.log('All workbook mappings match criteria values (63 entries)');
}

run();
