// extract_levels_v3.ts - Better row detection
import * as XLSX from 'xlsx';
import * as path from 'path';

const XLSX_PATH = path.resolve(__dirname, '../../../WP.xlsx');

const workbook = XLSX.readFile(XLSX_PATH);
const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

// Find the first row with an EC code
for (let r = 0; r < Math.min(sheet.length, 10); r++) {
  const row = sheet[r];
  const allCols = Object.keys(row).sort((a, b) => {
    const na = parseInt(a.replace('__EMPTY_', '')) || 0;
    const nb = parseInt(b.replace('__EMPTY_', '')) || 0;
    return na - nb;
  });
  const codeCol = '__EMPTY_13';
  const code = (row[codeCol] || '').toString().trim();
  console.log(`Row ${r}: code="${code}"`);
  
  if (code) {
    console.log('  Non-empty columns:');
    for (const col of allCols) {
      const val = row[col];
      if (val !== '' && val !== null && val !== undefined) {
        console.log(`    ${col}: "${val.toString().substring(0, 200)}"`);
      }
    }
    console.log('');
  }
}

// Also scan all rows for non-empty code column
console.log('\n=== All rows with codes ===\n');
for (let r = 0; r < sheet.length; r++) {
  const row = sheet[r];
  const code = (row['__EMPTY_13'] || '').toString().trim();
  if (code && /^EC/.test(code)) {
    // Find columns with level data
    const levelCols: Record<string, string> = {};
    const allCols = Object.keys(row).sort((a, b) => {
      const na = parseInt(a.replace('__EMPTY_', '')) || 0;
      const nb = parseInt(b.replace('__EMPTY_', '')) || 0;
      return na - nb;
    });
    for (const col of allCols) {
      if (col.startsWith('__EMPTY_')) {
        const n = parseInt(col.replace('__EMPTY_', ''));
        if (n >= 22 && n <= 120) {
          const val = (row[col] || '').toString().trim();
          if (val) levelCols[col] = val;
        }
      }
    }
    console.log(`${code}: ${Object.keys(levelCols).length} non-empty cols in 22-120 range`);
    const keys = Object.keys(levelCols);
    if (keys.length > 0) {
      console.log(`  ${keys[0]}: "${levelCols[keys[0]].substring(0, 150)}"`);
    }
  }
}
