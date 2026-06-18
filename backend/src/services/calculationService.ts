import metadata from './metadataService';
import { Criterion } from '../entities/Criterion';

type CriteriaMap = Record<string, number>;

function buildCriteriaFromList(list: any[], scores?: CriteriaMap, defaultScore = 3) {
  return list.map((c: any) => {
    const score: number = scores?.[c.code] ?? c.score ?? defaultScore;
    return {
      ...c,
      score,
      is: Number((c.value * score).toFixed(4)),
    };
  });
}

/** Derive sorted unique DT/AD IDs from criteria — NOT hardcoded. */
function uniqueSortedIds(items: any[], field: string): number[] {
  const ids = new Set<number>();
  for (const item of items) {
    const v = Number(item[field]);
    if (Number.isFinite(v) && v > 0) ids.add(v);
  }
  return [...ids].sort((a, b) => a - b);
}

export async function evaluate(buildingType: string, scores?: CriteriaMap) {
  const MAX_OBS = await metadata.getConfigNumber('MAX_OBS');
  if (!MAX_OBS) throw new Error('Missing configuration: MAX_OBS');

  const DEFAULT_SCORE = await metadata.getConfigNumber('DEFAULT_SCORE', 3);
  const STRENGTH_THRESHOLD = await metadata.getConfigNumber('STRENGTH_THRESHOLD', 5);
  const WEAKNESS_THRESHOLD = await metadata.getConfigNumber('WEAKNESS_THRESHOLD', 2);
  const TOP_N_RESULTS = await metadata.getConfigNumber('TOP_N_RESULTS', 5);

  const bt = await metadata.getBuildingType(buildingType);
  if (!bt || !Array.isArray(bt.disability_weights) || bt.disability_weights.length === 0) {
    throw new Error(`Missing or invalid disability_weights for building type: ${buildingType}`);
  }
  const dtWeightArr: number[] = bt.disability_weights;

  // Build dtWeight map dynamically — index 0 → DT 1, index 1 → DT 2, etc.
  const dtWeight: Record<number, number> = {};
  for (let i = 0; i < dtWeightArr.length; i++) {
    dtWeight[i + 1] = Number(dtWeightArr[i]);
  }

  const criteriaList = await metadata.getAllCriteria();
  const criteria = buildCriteriaFromList(criteriaList as any[], scores, DEFAULT_SCORE);

  // Dynamically derive DT/AD sets from actual criteria data
  const dtIds = uniqueSortedIds(criteria, 'disability');
  const adIds = uniqueSortedIds(criteria, 'dimension');

  // Initialize TIS/CIS buckets dynamically
  const tisByDT: Record<number, number> = {};
  const cisByAD: Record<number, number> = {};
  for (const dt of dtIds) tisByDT[dt] = 0;
  for (const ad of adIds) cisByAD[ad] = 0;

  for (const c of criteria) {
    const dt = Number(c.disability) as number;
    const ad = Number(c.dimension) as number;
    const isVal = Number(c.is) as number;
    if (dtIds.includes(dt)) tisByDT[dt] = (tisByDT[dt] ?? 0) + isVal;
    if (adIds.includes(ad)) cisByAD[ad] = (cisByAD[ad] ?? 0) + (dtWeight[dt] ?? 0) * isVal;
  }

  const obsRaw = (Object.entries(tisByDT) as [string, number][]).reduce(
    (sum: number, [dt, tis]: [string, number]) => sum + (dtWeight[Number(dt)] ?? 0) * tis,
    0,
  );

  const safeNumber = (v: number) => (Number.isFinite(v) ? v : 0);
  const obs = Number(safeNumber((obsRaw / MAX_OBS) * 100).toFixed(2));

  const nebRows = await metadata.getNebThresholds();
  const neb = nebRows.find((t: any) => obs >= t.min) ?? nebRows[nebRows.length - 1];

  const averageRawScore = Number(
    (criteria.reduce((a: number, b: any) => a + (b.score ?? 0), 0) / (criteria.length || 1)).toFixed(2),
  );

  const avgRawScoreByDT: Record<number, number> = {};
  for (const dt of dtIds) {
    const dtCriteria = criteria.filter((c: any) => Number(c.disability) === dt);
    const total = dtCriteria.reduce((a: number, b: any) => a + (b.score ?? 0), 0);
    avgRawScoreByDT[dt] = dtCriteria.length > 0 ? Number((total / dtCriteria.length).toFixed(2)) : 0;
  }

  const avgRawScoreByAD: Record<number, number> = {};
  for (const ad of adIds) {
    const adCriteria = criteria.filter((c: any) => Number(c.dimension) === ad);
    const total = adCriteria.reduce((a: number, b: any) => a + (b.score ?? 0), 0);
    avgRawScoreByAD[ad] = adCriteria.length > 0 ? Number((total / adCriteria.length).toFixed(2)) : 0;
  }

  const strengths = criteria
    .filter((c: any) => c.score >= STRENGTH_THRESHOLD)
    .slice(0, TOP_N_RESULTS);
  const weaknesses = [...criteria]
    .filter((c: any) => c.score <= WEAKNESS_THRESHOLD)
    .sort((a: any, b: any) => a.score - b.score)
    .slice(0, TOP_N_RESULTS);

  // Score distribution: count how many criteria scored at each level 1-5
  const scoreDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const c of criteria) {
    const s = Math.round(c.score);
    if (s >= 1 && s <= 5) scoreDistribution[s] = (scoreDistribution[s] || 0) + 1;
  }

  return {
    obs,
    nebClass: neb?.neb_class,
    nebEquivalent: neb?.equivalent,
    nebMeaning: neb?.meaning,
    nebScore: neb?.neb_score,
    averageRawScore,
    avgRawScoreByDT,
    avgRawScoreByAD,
    strengths,
    weaknesses,
    scoreDistribution,
    tisByDT: Object.fromEntries(
      Object.entries(tisByDT).map(([k, v]) => [k, Number(v.toFixed(4))]),
    ) as Record<number, number>,
    cisByAD: Object.fromEntries(
      Object.entries(cisByAD).map(([k, v]) => [k, Number(v.toFixed(4))]),
    ) as Record<number, number>,
    criteria,
  };
}

export default { evaluate };
