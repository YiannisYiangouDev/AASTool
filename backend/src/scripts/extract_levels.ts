// extract_levels.ts - Extract all levels from WP.xlsx and compare with MariaDB
import * as XLSX from 'xlsx';
import * as path from 'path';
import AppDataSource from '../data-source';
import { Criterion } from '../entities/Criterion';

const XLSX_PATH = path.resolve(__dirname, '../../../WP.xlsx');

async function main() {
  console.log('=== Extracting levels from WP.xlsx ===\n');

  // 1. Parse Excel
  const workbook = XLSX.readFile(XLSX_PATH);
  const sheetName = workbook.SheetNames[0];
  console.log(`Sheet: ${sheetName}`);
  
  const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName], { defval: '' });
  console.log(`Rows in sheet: ${sheet.length}\n`);

  // 2. Extract criteria with levels
  const xlsxCriteria: Record<string, {
    code: string;
    name: string;
    value: number;
    levels: string[];
  }> = {};

  for (const row of sheet) {
    // Try multiple column patterns for code
    const code = (row['__EMPTY_13'] || row['code'] || row['Code'] || '').toString().trim();
    if (!code || !/^EC\d+\.\d+\.\d+$/.test(code)) continue;

    const name = row['__EMPTY_14'] || row['__EMPTY'] || row['name'] || '';
    const value = parseFloat(row['__EMPTY_16'] || row['value'] || '0') || 0;

    // Levels are in columns __EMPTY_28 through __EMPTY_32 (or similar offset)
    const levelKeys = ['__EMPTY_28', '__EMPTY_29', '__EMPTY_30', '__EMPTY_31', '__EMPTY_32'];
    // Also try columns 23-27 (0-indexed), 28-32 (1-indexed)
    const colKeys = Object.keys(row);
    // Find keys that might be level columns
    const possibleLevelCols = colKeys.filter(k => 
      k.startsWith('__EMPTY_') && 
      parseInt(k.replace('__EMPTY_', '')) >= 23 && 
      parseInt(k.replace('__EMPTY_', '')) <= 37
    ).sort((a, b) => parseInt(a.replace('__EMPTY_', '')) - parseInt(b.replace('__EMPTY_', '')));

    let levels: string[] = [];
    if (possibleLevelCols.length >= 5) {
      levels = possibleLevelCols.slice(0, 5).map(k => String(row[k] || '').trim());
    } else {
      // Try the standard level keys
      levels = levelKeys.map(k => String(row[k] || '').trim());
    }

    xlsxCriteria[code] = { code, name: String(name).trim(), value, levels };
  }

  console.log(`Criteria extracted from Excel: ${Object.keys(xlsxCriteria).length}\n`);

  // 3. Query database
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Criterion);
  const dbCriteria = await repo.find({ order: { code: 'ASC' } });
  console.log(`Criteria in database: ${dbCriteria.length}\n`);

  // 4. Compare
  let match = 0;
  let mismatch = 0;
  let missingInDb = 0;
  let missingInXlsx = 0;
  let levelMismatch = 0;

  console.log('=== LEVEL COMPARISON ===\n');

  for (const db of dbCriteria) {
    const xl = xlsxCriteria[db.code];
    if (!xl) {
      missingInXlsx++;
      console.log(`⚠ MISSING IN XLSX: ${db.code}`);
      continue;
    }

    // Compare levels
    const dbLevels = (db as any).levels || [];
    const dbLevelArr = Array.isArray(dbLevels) ? dbLevels : 
      (typeof dbLevels === 'string' ? JSON.parse(dbLevels) : []);

    let levelsOk = true;
    for (let i = 0; i < 5; i++) {
      const xlLevel = (xl.levels[i] || '').replace(/\s+/g, ' ').trim();
      const dbLevel = (dbLevelArr[i] || '').replace(/\s+/g, ' ').trim();
      
      if (xlLevel !== dbLevel) {
        if (!levelMismatch) {
          console.log(`\n🔴 LEVEL MISMATCHES:`);
          console.log(`${'Code'.padEnd(12)} ${'Lvl'.padEnd(4)} ${'Excel'.padEnd(50)} | ${'DB'.padEnd(50)}`);
          console.log('-'.repeat(120));
        }
        console.log(`${db.code.padEnd(12)} ${(i+1).toString().padEnd(4)} ${xlLevel.substring(0, 48).padEnd(50)} | ${dbLevel.substring(0, 48).padEnd(50)}`);
        levelMismatch++;
        levelsOk = false;
      }
    }

    if (levelsOk) {
      match++;
    } else {
      mismatch++;
      console.log(`  ^ ${db.code} has level differences\n`);
    }
  }

  // Check for criteria in XLSX but not in DB
  for (const code of Object.keys(xlsxCriteria)) {
    if (!dbCriteria.find(d => d.code === code)) {
      missingInDb++;
      console.log(`⚠ MISSING IN DB: ${code} — ${xlsxCriteria[code].name}`);
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Excel criteria:       ${Object.keys(xlsxCriteria).length}`);
  console.log(`DB criteria:          ${dbCriteria.length}`);
  console.log(`Levels match:         ${match} ✅`);
  console.log(`Levels mismatch:      ${mismatch} ❌`);
  console.log(`Total level diffs:    ${levelMismatch}`);
  console.log(`Missing in DB:        ${missingInDb}`);
  console.log(`Missing in XLSX:      ${missingInXlsx}`);

  if (match === dbCriteria.length && missingInDb === 0 && missingInXlsx === 0) {
    console.log('\n✅ ALL LEVELS MATCH PERFECTLY!');
  }

  await AppDataSource.destroy();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
