import AppDataSource from '../data-source';
import { BuildingType } from '../entities/BuildingType';
import { Criterion } from '../entities/Criterion';
import { NebThreshold } from '../entities/NebThreshold';
import { Config } from '../entities/Config';

async function run() {
  await AppDataSource.initialize();
  const btRepo = AppDataSource.getRepository(BuildingType);
  const critRepo = AppDataSource.getRepository(Criterion);

  await critRepo.clear();
  await btRepo.clear();

  const buildingWeights = require('../data/building-types.json');
  const criteriaData = require('../data/criteria');

  for (const name of buildingWeights.buildingTypes) {
    const w = buildingWeights.weights?.[name];
    const b = new BuildingType();
    b.name = name;
    b.disability_weights = w?.disability ?? [];
    b.dimension_weights = w?.dimension ?? [];
    await btRepo.save(b);
  }

  const list = (criteriaData as any).criteria || (criteriaData as any).default || criteriaData;
  for (const c of list) {
    const e = new Criterion();
    e.code = c.code;
    e.name = c.name;
    e.definition = c.definition;
    e.justification = c.justification || '';
    e.value = c.value;
    e.disability = c.disability;
    e.dimension = c.dimension;
    e.score = c.score ?? 3;
    e.levels = c.levels || [];
    await critRepo.save(e);
  }


    const nebRepo = AppDataSource.getRepository(NebThreshold);
  await nebRepo.clear();
  const nebDefaults = [
    { min: 85, neb_class: 'A+', equivalent: '5', meaning: 'Excellent / Best practice', neb_score: 5, ordinal: 1 },
    { min: 60, neb_class: 'A', equivalent: '4', meaning: 'Good', neb_score: 4, ordinal: 2 },
    { min: 40, neb_class: 'B', equivalent: '3', meaning: 'Acceptable', neb_score: 3, ordinal: 3 },
    { min: 0, neb_class: 'No Rating', equivalent: 'N/A', meaning: 'Non-compliant', neb_score: 1, ordinal: 4 },
  ];
  for (const n of nebDefaults) {
    const en = new NebThreshold();
    Object.assign(en, n);
    await nebRepo.save(en);
  }

  const cfgRepo = AppDataSource.getRepository(Config);
  await cfgRepo.clear();
  const cfgs = [
    { key: 'MAX_OBS', value: '25' },
    { key: 'DEFAULT_SCORE', value: '3' },
    { key: 'STRENGTH_THRESHOLD', value: '5' },
    { key: 'WEAKNESS_THRESHOLD', value: '2' },
    { key: 'TOP_N_RESULTS', value: '5' },
  ];
  for (const c of cfgs) {
    const ce = new Config();
    ce.key = c.key;
    ce.value = c.value;
    await cfgRepo.save(ce);
  }

  console.log('Seeding complete');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
