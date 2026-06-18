// sync_levels_from_xlsx.ts - Update DB criteria levels from WP.xlsx
import * as XLSX from 'xlsx';
import * as path from 'path';
import { AppDataSource } from '../data-source';
import { Criterion } from '../entities/Criterion';

const XLSX_PATH = path.resolve(__dirname, '../../../WP.xlsx');

const BLOCK_STRUCTURE = [
  { codeCol: 23, levelStart: 28 },
  { codeCol: 38, levelStart: 43 },
  { codeCol: 53, levelStart: 58 },
  { codeCol: 68, levelStart: 73 },
  { codeCol: 83, levelStart: 88 },
];

function colKey(n: number): string {
  return n === 0 ? '__EMPTY' : `__EMPTY_${n}`;
}

async function main() {
  const workbook = XLSX.readFile(XLSX_PATH);
  const sheet = XLSX.utils.sheet_to_json<any>(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });

  // Extract levels from Excel
  const excelLevels: Record<string, string[]> = {};

  for (const row of sheet) {
    for (const block of BLOCK_STRUCTURE) {
      const codeKey = colKey(block.codeCol);
      const code = (row[codeKey] || '').toString().trim();
      if (!code || !/^EC\d+\.\d+\.\d+$/.test(code)) continue;

      const levels: string[] = [];
      for (let l = 0; l < 5; l++) {
        const lKey = colKey(block.levelStart + l);
        levels.push((row[lKey] || '').toString().trim());
      }

      if (levels.some(l => l.length > 0)) {
        excelLevels[code] = levels;
      }
    }
  }

  console.log(`Extracted ${Object.keys(excelLevels).length} criteria with levels from Excel.`);

  // Connect to DB
  await AppDataSource.initialize();
  const criteriaRepo = AppDataSource.getRepository(Criterion);

  let updated = 0;
  let skipped = 0;

  for (const [code, levels] of Object.entries(excelLevels)) {
    const criterion = await criteriaRepo.findOne({ where: { code } });
    if (!criterion) {
      console.log(`  SKIP ${code}: not found in DB`);
      skipped++;
      continue;
    }

    criterion.levels = levels;
    await criteriaRepo.save(criterion);
    console.log(`  OK   ${code}: ${levels.map(l => l.substring(0, 40)).join(' | ')}`);
    updated++;
  }

  console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
  await AppDataSource.destroy();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
