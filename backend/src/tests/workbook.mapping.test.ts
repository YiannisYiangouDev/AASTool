import 'dotenv/config';
import assert from 'assert';
import path from 'path';

// ── Load compiled criteria data ─────────────────────────────────────
const criteriaData = require(path.join(__dirname, '..', 'data', 'criteria'));
const criteria: any[] = criteriaData.criteria || criteriaData.default || criteriaData;
const buildingTypesData = require(path.join(__dirname, '..', 'data', 'building-types.json'));

// ── Static validation (no DB) ───────────────────────────────────────

function testCriteriaCount() {
  assert(criteria.length === 63, `expected 63 criteria, got ${criteria.length}`);
  console.log(`  ✓ ${criteria.length} total criteria`);
}

function testCodeFormat() {
  const badCodes = criteria.filter((c: any) => !/^EC\d+\.\d+\.\d+$/.test(c.code));
  assert(badCodes.length === 0, `bad codes found: ${badCodes.map((c: any) => c.code).join(', ')}`);
  console.log('  ✓ All codes match EC{dt}.{ad}.{seq} format');
}

function testCodeMatchesDisabilityDimension() {
  const mismatched = criteria.filter((c: any) => {
    const parts = c.code.split('.');
    const codeDt = parseInt(parts[0].replace('EC', ''));
    const codeAd = parseInt(parts[1]);
    return codeDt !== c.disability || codeAd !== c.dimension;
  });
  assert(mismatched.length === 0, `mismatched: ${mismatched.map((c: any) => c.code).join(', ')}`);
  console.log('  ✓ Codes match disability.dimension fields');
}

function testDisabilityDistribution() {
  const dtCounts: Record<number, number> = {};
  for (const c of criteria) {
    dtCounts[c.disability] = (dtCounts[c.disability] || 0) + 1;
  }
  // Each DT should have criteria (some may have more than others)
  const dts = Object.keys(dtCounts).map(Number);
  assert(dts.length === 5, 'should cover all 5 disability types');
  for (const dt of dts) {
    assert(dtCounts[dt] > 0, `DT${dt} should have at least 1 criterion`);
  }
  console.log('  ✓ All 5 disability types have criteria');
}

function testDimensionDistribution() {
  const adCounts: Record<number, number> = {};
  for (const c of criteria) {
    adCounts[c.dimension] = (adCounts[c.dimension] || 0) + 1;
  }
  const ads = Object.keys(adCounts).map(Number);
  assert(ads.length === 5, 'should cover all 5 assessment dimensions');
  console.log('  ✓ All 5 assessment dimensions have criteria');
}

function testEachDtAdPair() {
  // Every DT-AD combination should have at least 1 criterion (5x5=25 pairs)
  const pairs = new Set<string>();
  for (const c of criteria) {
    pairs.add(`DT${c.disability}-AD${c.dimension}`);
  }
  assert(pairs.size === 25, `expected 25 DT-AD pairs, got ${pairs.size}`);
  console.log('  ✓ All 25 DT-AD combinations are represented');
}

function testLevels() {
  const badLevels = criteria.filter((c: any) => !c.levels || c.levels.length !== 5);
  assert(badLevels.length === 0, `criteria without 5 levels: ${badLevels.map((c: any) => c.code).join(', ')}`);
  console.log('  ✓ All criteria have exactly 5 levels');
}

function testValueRange() {
  const badValues = criteria.filter((c: any) => typeof c.value !== 'number' || c.value <= 0 || c.value > 1);
  assert(badValues.length === 0, `bad values: ${badValues.map((c: any) => c.code).join(', ')}`);
  console.log('  ✓ All values in range (0, 1]');
}

function testScoreRange() {
  const badScores = criteria.filter((c: any) => c.score < 1 || c.score > 5);
  assert(badScores.length === 0, `bad scores: ${badScores.map((c: any) => c.code).join(', ')}`);
  console.log('  ✓ All default scores in 1-5 range');
}

function testCodeUniqueness() {
  const codes = criteria.map((c: any) => c.code);
  const unique = new Set(codes);
  assert(unique.size === codes.length, 'duplicate codes found');
  console.log('  ✓ All codes are unique');
}

function testBuildingTypesStructure() {
  const types = buildingTypesData.buildingTypes;
  assert(Array.isArray(types), 'buildingTypes should be an array');
  assert(types.length >= 5, `expected at least 5 building types, got ${types.length}`);
  console.log(`  ✓ ${types.length} building types defined`);

  const weights = buildingTypesData.weights;
  assert(weights, 'weights should be defined');
  for (const bt of types) {
    const w = weights[bt];
    assert(w, `weights missing for ${bt}`);
    assert(Array.isArray(w.disability) && w.disability.length === 5, `disability_weights for ${bt}`);
    assert(Array.isArray(w.dimension) && w.dimension.length === 5, `dimension_weights for ${bt}`);
  }
  console.log('  ✓ All building types have valid weights');
}

function testDisabilityDimensionNames() {
  const dt = buildingTypesData.disabilityTypes;
  const ad = buildingTypesData.dimensions;
  assert(dt.length === 5, 'should have 5 disability type names');
  assert(ad.length === 5, 'should have 5 dimension names');
  console.log('  ✓ Disability type and dimension names present');
}

// ── Run ─────────────────────────────────────────────────────────────

async function run() {
  console.log('\nWorkbook Mapping Tests\n');

  testCriteriaCount();
  testCodeFormat();
  testCodeMatchesDisabilityDimension();
  testDisabilityDistribution();
  testDimensionDistribution();
  testEachDtAdPair();
  testLevels();
  testValueRange();
  testScoreRange();
  testCodeUniqueness();
  testBuildingTypesStructure();
  testDisabilityDimensionNames();

  console.log('\nAll workbook mapping tests passed');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
