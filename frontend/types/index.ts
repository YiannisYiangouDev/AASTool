export interface Criterion {
  id: string;
  code: string;
  name: string;
  definition: string;
  justification: string;
  value: number;
  disability: number;
  dimension: number;
  score: number;
  levels: string[];
}

export interface EvaluationResult {
  obs: number;
  nebClass: string;
  nebEquivalent: string;
  nebMeaning: string;
  nebScore: number;
  averageRawScore: number;
  avgRawScoreByDT: Record<number, number>;
  avgRawScoreByAD: Record<number, number>;
  strengths: Criterion[];
  weaknesses: Criterion[];
  tisByDT: Record<number, number>;
  cisByAD: Record<number, number>;
  criteria: Criterion[];
  scoreDistribution?: Record<number, number>;
}

export interface BuildingTypesResponse {
  ok: boolean;
  data: Array<{
    id: string;
    name: string;
    disability_weights: number[];
    dimension_weights: number[];
  }>;
}
