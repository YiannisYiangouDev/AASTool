// extract_all_levels.ts - Comprehensive level extraction from WP.xlsx
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { AppDataSource } from '../data-source';
import { Criterion } from '../entities/Criterion';

const XLSX_PATH = path.resolve(__dirname, '../../../WP.xlsx');

// Each row has 5 blocks. Each block has:
// - EC code at offset 0
// - Criteria name at offset 1
// - Definition at offset 2
// - Weight at offset 3
// - ΣW at offset 4
// - Levels at offsets 5-9
const BLOCK_STRUCTURE = [
  { codeCol: 23, levelStart: 28 },  // Block 1: cols 23-32
  { codeCol: 38, levelStart: 43 },  // Block 2: cols 38-47
  { codeCol: 53, levelStart: 58 },  // Block 3: cols 53-62
  { codeCol: 68, levelStart: 73 },  // Block 4: cols 68-77
  { codeCol: 83, levelStart: 88 },  // Block 5: cols 83-92
];

function colKey(n: number): string {
  return n === 0 ? '__EMPTY' : `__EMPTY_${n}`;
}

async function main() {
  const workbook = XLSX.readFile(XLSX_PATH);
  const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

  // Extract all criteria + levels from Excel
  const excelData: Record<string, { code: string; name: string; definition: string; levels: string[] }> = {};

  for (const row of sheet) {
    for (const block of BLOCK_STRUCTURE) {
      const codeKey = colKey(block.codeCol);
      const code = (row[codeKey] || '').toString().trim();
      
      if (!code || !/^EC\d+\.\d+\.\d+$/.test(code)) continue;

      const nameKey = colKey(block.codeCol + 1);
      const defKey = colKey(block.codeCol + 2);
      const name = (row[nameKey] || '').toString().trim();
      const definition = (row[defKey] || '').toString().trim();

      const levels: string[] = [];
      for (let l = 0; l < 5; l++) {
        const lKey = colKey(block.levelStart + l);
        levels.push((row[lKey] || '').toString().trim());
      }

      // Only keep if at least one level has data
      if (levels.some(l => l.length > 0)) {
        if (!excelData[code] || levels.filter(l => l.length > 0).length >= excelData[code].levels.filter(l => l.length > 0).length) {
          excelData[code] = { code, name, definition, levels };
        }
      }
    }
  }

  console.log(`Unique criteria with levels in Excel: ${Object.keys(excelData).length}`);

  // Connect to DB
  await AppDataSource.initialize();
  const criteriaRepo = AppDataSource.getRepository(Criterion);
  const dbCriteria = await criteriaRepo.find({ order: { code: 'ASC' } });
  console.log(`Criteria in DB: ${dbCriteria.length}`);

  // Compare
  console.log('\n================================================================================');
  console.log('LEVEL COMPARISON: Excel vs Database');
  console.log('================================================================================\n');

  let totalMatch = 0;
  let totalMismatch = 0;
  let totalMissingDB = 0;
  let totalMissingExcel = 0;
  let totalLevelDiffs = 0;

  // Output detailed comparison
  const allCodes = new Set([...Object.keys(excelData), ...dbCriteria.map(c => c.code)]);
  const sortedCodes = [...allCodes].sort();

  const mismatches: string[] = [];

  for (const code of sortedCodes) {
    const xl = excelData[code];
    const db = dbCriteria.find(c => c.code === code);

    if (!db) {
      totalMissingDB++;
      mismatches.push(`${code}: MISSING in DB (exists in Excel)`);
      continue;
    }
    if (!xl) {
      totalMissingExcel++;
      mismatches.push(`${code}: MISSING in Excel (exists in DB)`);
      continue;
    }

    // levels is simple-json column, deserialized as string[]
    const dbLevels: string[] = Array.isArray(db.levels) ? db.levels : (typeof db.levels === 'string' ? JSON.parse(db.levels) : ['','','','','']);

    let allMatch = true;
    for (let i = 0; i < 5; i++) {
      const xlLevel = xl.levels[i];
      const dbLevel = dbLevels[i];
      if (xlLevel !== dbLevel) {
        allMatch = false;
        totalLevelDiffs++;
        mismatches.push(`${code} | L${i + 1} | Excel: "${xlLevel.substring(0, 80)}" | DB: "${dbLevel.substring(0, 80)}"`);
      }
    }

    if (allMatch) {
      totalMatch++;
    } else {
      totalMismatch++;
    }
  }

  // Print mismatches
  if (mismatches.length > 0) {
    console.log('--- MISMATCHES ---\n');
    for (const m of mismatches) {
      console.log(m);
    }
    console.log('');
  }

  // Summary
  console.log('================================================================================');
  console.log('SUMMARY');
  console.log('================================================================================');
  console.log(`  Full match (all 5 levels identical): ${totalMatch}`);
  console.log(`  Mismatch (at least 1 level differs): ${totalMismatch}`);
  console.log(`  Total level field diffs:             ${totalLevelDiffs}`);
  console.log(`  Missing in DB:                       ${totalMissingDB}`);
  console.log(`  Missing in Excel:                    ${totalMissingExcel}`);
  console.log(`  Total criteria in Excel:             ${Object.keys(excelData).length}`);
  console.log(`  Total criteria in DB:                ${dbCriteria.length}`);
  console.log('================================================================================');

  await AppDataSource.destroy();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
