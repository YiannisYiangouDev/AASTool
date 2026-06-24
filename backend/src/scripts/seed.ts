import 'dotenv/config';
import AppDataSource from '../data-source';
import { BuildingType } from '../entities/BuildingType';
import { Criterion } from '../entities/Criterion';
import { NebThreshold } from '../entities/NebThreshold';
import { Config } from '../entities/Config';
import { DisabilityType } from '../entities/DisabilityType';
import { AssessmentDimension } from '../entities/AssessmentDimension';

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
    { min: 20, neb_class: 'C', equivalent: '2', meaning: 'Below Average', neb_score: 2, ordinal: 4 },
    { min: 0, neb_class: 'No Rating', equivalent: 'N/A', meaning: 'Non-compliant', neb_score: 1, ordinal: 5 },
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

  // Seed disability types with icon/color metadata
  const dtRepo = AppDataSource.getRepository(DisabilityType);
  await dtRepo.clear();
  const dtSeed = [
    { id: 1, name: 'Physical Disability',        icon: '🦽', gradient: 'from-teal-500 to-cyan-400',    bg_color: 'from-teal-500/10 to-cyan-500/10',   text_color: 'text-teal-300',   border_color: 'border-teal-500/20' },
    { id: 2, name: 'Sensory Disability',          icon: '👁️', gradient: 'from-blue-500 to-indigo-400',   bg_color: 'from-blue-500/10 to-indigo-500/10',  text_color: 'text-blue-300',   border_color: 'border-blue-500/20' },
    { id: 3, name: 'Cognitive & Neurodiverse',    icon: '🧩', gradient: 'from-violet-500 to-purple-400', bg_color: 'from-violet-500/10 to-purple-500/10', text_color: 'text-purple-300', border_color: 'border-purple-500/20' },
    { id: 4, name: 'Communication & Mental Health', icon: '💬', gradient: 'from-amber-500 to-orange-400', bg_color: 'from-amber-500/10 to-orange-500/10',  text_color: 'text-orange-300', border_color: 'border-amber-500/20' },
    { id: 5, name: 'Multiple / Situational',      icon: '🌐', gradient: 'from-rose-500 to-pink-400',    bg_color: 'from-rose-500/10 to-pink-500/10',     text_color: 'text-pink-300',   border_color: 'border-rose-500/20' },
  ];
  for (const d of dtSeed) {
    await dtRepo.save(Object.assign(new DisabilityType(), d));
  }

  // Seed assessment dimensions with icon/color metadata
  const adRepo = AppDataSource.getRepository(AssessmentDimension);
  await adRepo.clear();
  const adSeed = [
    { id: 1, name: 'Spatial & Physical Accessibility',     icon: '🏗️', gradient: 'from-teal-500 to-emerald-400',   bg_color: 'from-teal-500/10 to-emerald-500/10',  text_color: 'text-emerald-300', border_color: 'border-emerald-500/20' },
    { id: 2, name: 'Safety & Environmental Comfort',        icon: '🛡️', gradient: 'from-sky-500 to-blue-400',      bg_color: 'from-sky-500/10 to-blue-500/10',      text_color: 'text-sky-300',    border_color: 'border-sky-500/20' },
    { id: 3, name: 'Cognitive & Navigational Accessibility', icon: '🧠', gradient: 'from-indigo-500 to-violet-400', bg_color: 'from-indigo-500/10 to-violet-500/10',  text_color: 'text-indigo-300', border_color: 'border-indigo-500/20' },
    { id: 4, name: 'Digital Interaction & Smart Usability',  icon: '💻', gradient: 'from-orange-500 to-amber-400',  bg_color: 'from-orange-500/10 to-amber-500/10',   text_color: 'text-amber-300',  border_color: 'border-amber-500/20' },
    { id: 5, name: 'Social Inclusion & Human Experience',    icon: '🤝', gradient: 'from-rose-500 to-pink-400',     bg_color: 'from-rose-500/10 to-pink-500/10',      text_color: 'text-rose-300',   border_color: 'border-rose-500/20' },
  ];
  for (const d of adSeed) {
    await adRepo.save(Object.assign(new AssessmentDimension(), d));
  }

  console.log('Seeding complete');
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
