import AppDataSource from '../data-source';
import { Criterion } from '../entities/Criterion';
import * as fs from 'fs';
import * as path from 'path';

async function run() {
  console.log('=== Starting workbook criteria population ===');
  
  // Try multiple paths for workbook.json
  const workbookPaths = [
    path.resolve(__dirname, '../../../../html/lib/supabase/workbook.json'),
    path.resolve(__dirname, '../../WP.xlsx'),  // Try local Excel file
    path.resolve(process.cwd(), 'WP.xlsx'),
    path.resolve(process.cwd(), 'html/lib/supabase/workbook.json'),
  ];

  let workbookPath = '';
  for (const p of workbookPaths) {
    if (fs.existsSync(p)) {
      workbookPath = p;
      break;
    }
  }

  if (!workbookPath) {
    console.warn('WARNING: workbook.json not found in any expected location.');
    console.warn('Skipping workbook-based population. Use "npm run seed" to seed criteria from criteria.ts instead.');
    console.warn('Searched paths:');
    workbookPaths.forEach(p => console.warn(`  - ${p}`));
    process.exit(0);  // Graceful exit, not an error
  }

  console.log(`Loading workbook from: ${workbookPath}`);
  const workbook = JSON.parse(fs.readFileSync(workbookPath, 'utf8'));
  const sheet = workbook['Accessibility Assessment Scheme'];
  
  if (!sheet) {
    console.error('ERROR: Sheet "Accessibility Assessment Scheme" not found in workbook');
    process.exit(1);
  }
  
  console.log(`Workbook loaded, found ${sheet.length} rows`);

  const workbookCriteria: Record<string, {
    name: string;
    definition: string;
    value: number;
    justification: string;
    levels: string[];
  }> = {};

  console.log('Extracting criteria from workbook...');
  for (const row of sheet) {
    const code = row['__EMPTY_13'];
    if (!code || typeof code !== 'string') continue;

    const trimmedCode = code.trim();
    if (!/^(EC|EC)\d+\.\d+\.\d+$/.test(trimmedCode) && !/^EC\d+\.\d+\.\d+$/.test(trimmedCode)) continue;

    const name = row['__EMPTY_14'] || trimmedCode;
    const definition = row['__EMPTY_15'] || '';
    const value = row['__EMPTY_16'] || 0;
    const justification = row['__EMPTY_17'] || '';

    const levelKeys = ['__EMPTY_28', '__EMPTY_29', '__EMPTY_30', '__EMPTY_31', '__EMPTY_32'];
    const levels: string[] = [];
    for (const key of levelKeys) {
      levels.push(row[key] || '');
    }

    if (trimmedCode) {
      workbookCriteria[trimmedCode] = {
        name: name,
        definition: definition,
        value: value,
        justification: justification,
        levels: levels
      };
    }
  }

  console.log(`✓ Extracted ${Object.keys(workbookCriteria).length} criteria from workbook`);

  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✓ Database connection established');
    } else {
      console.log('✓ Database already connected');
    }
  } catch (err) {
    console.error('✗ Database connection failed:', err);
    process.exit(1);
  }
  
  const repo = AppDataSource.getRepository(Criterion);
  console.log('✓ Repository ready');

  const initialCount = await repo.count();
  console.log(`Current criteria in database: ${initialCount}`);

  console.log('\n=== Processing criteria ===');
  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const [code, data] of Object.entries(workbookCriteria)) {
    try {
      let criterion = await repo.findOne({ where: { code } });

      if (criterion) {
        criterion.name = data.name;
        criterion.definition = data.definition;
        criterion.justification = data.justification;
        criterion.value = data.value;
        criterion.levels = data.levels;
        await repo.save(criterion);
        updated++;
        console.log(`✓ Updated ${code}: ${data.name}`);
      } else {
        const match = code.match(/^EC(\d+)\.(\d+)\.(\d+)$/);
        if (!match) {
          console.log(`⚠ Skipped ${code}: invalid code format`);
          errors++;
          continue;
        }

        const disability = parseInt(match[1]);
        const dimension = parseInt(match[2]);

        criterion = new Criterion();
        criterion.code = code;
        criterion.name = data.name;
        criterion.definition = data.definition;
        criterion.justification = data.justification;
        criterion.value = data.value;
        criterion.levels = data.levels;
        criterion.disability = disability;
        criterion.dimension = dimension;
        criterion.score = 3; // default score

        await repo.save(criterion);
        created++;
        console.log(`✓ Created ${code}: ${data.name}`);
      }
    } catch (err) {
      console.error(`✗ Error processing ${code}:`, err);
      errors++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`  Updated: ${updated}`);
  console.log(`  Created: ${created}`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Total processed: ${updated + created}`);

  const finalCount = await repo.count();
  console.log(`  Database total: ${finalCount}`);

  console.log('\n=== Cleaning up ===');
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('✓ Database connection closed');
  }
  console.log('✓ Done!');
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
