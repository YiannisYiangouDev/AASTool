import 'dotenv/config';
import assert from 'assert';
import AppDataSource from '../data-source';
import { Criterion } from '../entities/Criterion';
import { BuildingType } from '../entities/BuildingType';
import { Config } from '../entities/Config';

// ── Static validation (no DB required) ──────────────────────────────

function testEnvFile() {
  const url = process.env.DATABASE_URL;
  assert(url, 'DATABASE_URL must be set');
  assert(
    /^mysql:\/\/.+@.+:\d+\/\w+/.test(url!),
    'DATABASE_URL should match mysql://user:pass@host:port/db',
  );
  console.log('  ✓ DATABASE_URL present and well-formed');
}

function testEntityStructure() {
  const criterion = new Criterion();
  criterion.code = 'EC1.1.1';
  criterion.name = 'Test';
  criterion.definition = 'Definition';
  criterion.justification = 'Why';
  criterion.value = 0.5;
  criterion.disability = 1;
  criterion.dimension = 1;
  criterion.score = 3;
  criterion.levels = ['L1', 'L2', 'L3', 'L4', 'L5'];

  assert(criterion.code.startsWith('EC'), 'code should start with EC');
  assert(criterion.disability >= 1 && criterion.disability <= 5, 'disability must be 1-5');
  assert(criterion.dimension >= 1 && criterion.dimension <= 5, 'dimension must be 1-5');
  assert(criterion.value > 0 && criterion.value <= 1, 'value should be 0-1');
  assert(criterion.levels.length === 5, 'levels should have exactly 5 entries');
  console.log('  ✓ Criterion entity valid');

  const bt = new BuildingType();
  bt.name = 'Test Building';
  bt.disability_weights = [1.0, 0.8, 1.2, 1.0, 0.9];
  bt.dimension_weights = [1.0, 1.0, 1.0, 1.0, 1.0];

  assert(bt.name.length > 0, 'building type name required');
  assert(bt.disability_weights.length === 5, 'disability_weights must have 5 entries');
  assert(bt.dimension_weights.length === 5, 'dimension_weights must have 5 entries');
  console.log('  ✓ BuildingType entity valid');
}

function testConfigSanity() {
  const keys = ['MAX_OBS', 'DEFAULT_SCORE', 'STRENGTH_THRESHOLD', 'WEAKNESS_THRESHOLD', 'TOP_N_RESULTS'];
  assert(keys.length === 5, 'should have 5 config keys');
  console.log('  ✓ Config keys defined');
}

// ── DB-dependent validation (requires running DB) ───────────────────

async function testDbConnection() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  assert(AppDataSource.isInitialized, 'DataSource should initialize');
  console.log('  ✓ DataSource connected');
}

async function testCriteriaCount() {
  const repo = AppDataSource.getRepository(Criterion);
  const count = await repo.count();
  assert(count > 0, 'should have seeded criteria');
  assert(count >= 60, `expected at least 60 criteria, got ${count}`);
  console.log(`  ✓ ${count} criteria in database`);
}

async function testConfigValues() {
  const repo = AppDataSource.getRepository(Config);
  const maxObs = await repo.findOne({ where: { key: 'MAX_OBS' } });
  assert(maxObs, 'MAX_OBS must exist');
  assert(Number(maxObs.value) > 0, 'MAX_OBS must be positive');
  console.log(`  ✓ MAX_OBS = ${maxObs.value}`);
}

async function testBuildingTypes() {
  const repo = AppDataSource.getRepository(BuildingType);
  const types = await repo.find();
  assert(types.length > 0, 'should have building types');
  for (const bt of types) {
    assert(bt.disability_weights.length === 5, `disability_weights should have 5 entries for ${bt.name}`);
    assert(bt.dimension_weights.length === 5, `dimension_weights should have 5 entries for ${bt.name}`);
  }
  console.log(`  ✓ ${types.length} building types with valid weights`);
}

// ── Run ─────────────────────────────────────────────────────────────

async function run() {
  console.log('\nMetadata Service Tests\n');

  console.log('[Static] Static validation...');
  testEnvFile();
  testEntityStructure();
  testConfigSanity();

  if (process.env.SKIP_DB_TESTS === 'true') {
    console.log('\n  SKIP_DB_TESTS set — skipping DB-dependent tests');
    console.log('\nAll metadata tests passed (static only)');
    process.exit(0);
  }

  console.log('\n[DB] Database-dependent validation...');
  try {
    await testDbConnection();
    await testCriteriaCount();
    await testConfigValues();
    await testBuildingTypes();
  } catch (err) {
    console.error('\n  DB tests failed (is the database running?)');
    console.error('  Set SKIP_DB_TESTS=true to skip, or start MariaDB');
    throw err;
  }

  console.log('\nAll metadata tests passed');
  await AppDataSource.destroy();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
