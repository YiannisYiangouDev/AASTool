import AppDataSource from '../data-source';
import { NebThreshold } from '../entities/NebThreshold';
import { Config } from '../entities/Config';
import { BuildingType } from '../entities/BuildingType';
import { Criterion } from '../entities/Criterion';

let initialized = false;
let cache: any = {};

async function init() {
  if (initialized || (AppDataSource as any).isInitialized) return;
  await AppDataSource.initialize();
  initialized = true;
}

export async function getNebThresholds() {
  await init();
  if (cache.neb) return cache.neb;
  const repo = AppDataSource.getRepository(NebThreshold);
  const rows = await repo.find({ order: { min: 'DESC' } });
  cache.neb = rows;
  return rows;
}

export async function getConfigNumber(key: string, fallback = 0) {
  await init();
  cache.config = cache.config || {};
  if (cache.config[key] !== undefined) return Number(cache.config[key]);
  const repo = AppDataSource.getRepository(Config);
  const row = await repo.findOne({ where: { key } });
  const val = row ? Number(row.value) : fallback;
  cache.config[key] = val;
  return val;
}

export async function getBuildingType(name: string) {
  await init();
  const repo = AppDataSource.getRepository(BuildingType);
  const bt = await repo.findOne({ where: { name } });
  return bt;
}

export async function getAllCriteria() {
  await init();
  const repo = AppDataSource.getRepository(Criterion);
  const list = await repo.find();
  return list;
}

export async function validateMetadata() {
  await init();
  const cfgRepo = AppDataSource.getRepository(Config);
  const btRepo = AppDataSource.getRepository(BuildingType);
  const critRepo = AppDataSource.getRepository(Criterion);
  const nebRepo = AppDataSource.getRepository(NebThreshold);

  const maxObsRow = await cfgRepo.findOne({ where: { key: 'MAX_OBS' } });
  if (!maxObsRow) throw new Error('Missing config: MAX_OBS');

  const btCount = await btRepo.count();
  if (btCount < 1) throw new Error('No building types seeded');

  const critCount = await critRepo.count();
  if (critCount < 1) throw new Error('No criteria seeded');

  const nebCount = await nebRepo.count();
  if (nebCount < 1) throw new Error('No NEB thresholds seeded');

  return true;
}

export default { getNebThresholds, getConfigNumber, getBuildingType, getAllCriteria, validateMetadata };
