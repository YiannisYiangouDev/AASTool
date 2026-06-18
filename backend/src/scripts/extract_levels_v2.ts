// extract_levels_v2.ts - Better column detection for WP.xlsx
import * as XLSX from 'xlsx';
import * as path from 'path';

const XLSX_PATH = path.resolve(__dirname, '../../../WP.xlsx');

const workbook = XLSX.readFile(XLSX_PATH);
const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

// Print ALL columns for row 2 (first data row with EC1.1.1) to map where levels are
const row2 = sheet[1]; // 0 = header, 1 = EC1.1.1
const allCols = Object.keys(row2).sort((a, b) => {
  const na = parseInt(a.replace('__EMPTY_', '')) || 0;
  const nb = parseInt(b.replace('__EMPTY_', '')) || 0;
  return na - nb;
});

console.log('=== Row 2 (EC1.1.1) — all non-empty columns ===\n');
for (const col of allCols) {
  const val = row2[col];
  if (val !== '' && val !== null && val !== undefined) {
    console.log(`  ${col}: "${val.toString().substring(0, 120)}"`);
  }
}

// Also check row 3 (EC1.1.2)
console.log('\n=== Row 3 (EC1.1.2) — all non-empty columns ===\n');
const row3 = sheet[2];
if (row3) {
  for (const col of allCols) {
    const val = row3[col];
    if (val !== '' && val !== null && val !== undefined) {
      console.log(`  ${col}: "${val.toString().substring(0, 120)}"`);
    }
  }
}

// Look specifically at columns around 22-37 for ALL rows to find level patterns
console.log('\n=== Checking level columns (22-38) for rows 1-3 ===\n');
for (let r = 0; r < 3; r++) {
  const row = sheet[r];
  if (!row) continue;
  const code = (row['__EMPTY_13'] || '').toString().trim();
  console.log(`\nRow ${r}: code="${code}"`);
  for (let c = 22; c <= 38; c++) {
    const key = c === 0 ? '__EMPTY' : `__EMPTY_${c}`;
    const val = row[key];
    if (val !== '' && val !== undefined && val !== null) {
      console.log(`  col ${c} (${key}): "${val.toString().substring(0, 150)}"`);
    }
  }
}
