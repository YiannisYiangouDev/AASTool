// extract_levels_simple.ts - Extract levels from XLSX, write to JSON for comparison
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const XLSX_PATH = path.resolve(__dirname, '../../../WP.xlsx');
const OUTPUT_PATH = path.resolve(__dirname, '../tests/xlsx_levels.json');

const workbook = XLSX.readFile(XLSX_PATH);
const sheetName = workbook.SheetNames[0];
console.log('Sheet:', sheetName);

const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName], { defval: '' });
console.log('Rows:', sheet.length);

// Dump column names from first row to understand structure
const firstRow = sheet[0] || {};
const colNames = Object.keys(firstRow);
console.log('Columns:', colNames.length);
console.log('Sample keys:', colNames.slice(0, 20));

// Extract criteria
const criteria: Record<string, any> = {};
for (const row of sheet) {
  const code = (row['__EMPTY_13'] || '').toString().trim();
  if (!code || !/^EC\d+\.\d+\.\d+$/.test(code)) continue;

  const name = (row['__EMPTY_14'] || '').toString().trim();
  const value = parseFloat(row['__EMPTY_16'] || '0') || 0;
  const definition = (row['__EMPTY_15'] || '').toString().trim();
  const justification = (row['__EMPTY_17'] || '').toString().trim();

  const levelKeys = ['__EMPTY_28', '__EMPTY_29', '__EMPTY_30', '__EMPTY_31', '__EMPTY_32'];
  const levels = levelKeys.map(k => (row[k] || '').toString().trim());

  criteria[code] = { code, name, value, definition, justification, levels };
}

console.log('Criteria extracted:', Object.keys(criteria).length);
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(criteria, null, 2), 'utf8');
console.log('Written to:', OUTPUT_PATH);

// Print all levels for manual inspection
console.log('\n=== ALL LEVELS FROM XLSX ===\n');
const codes = Object.keys(criteria).sort();
for (const code of codes) {
  const c = criteria[code];
  console.log(`${code} | ${c.name}`);
  for (let i = 0; i < 5; i++) {
    console.log(`  L${i+1}: ${c.levels[i].substring(0, 100)}`);
  }
  console.log('');
}
