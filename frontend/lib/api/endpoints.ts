import { api } from "./client";
import type { BuildingTypesResponse, Criterion, EvaluationResult } from '../../types';

async function unwrap<T>(promise: Promise<any>): Promise<T> {
  const res = await promise;
  return res.data.data ?? res.data;
}

export const endpoints = {
  healthCheck: () => unwrap<{
    status: string;
    uptime: number;
    database: string;
    dbLatencyMs: number | null;
    version: string;
    timestamp: string;
  }>(api.get('/health')),

  getBuildings: () => unwrap<any[]>(api.get('/buildings')),
  getBuilding: (id: string) => unwrap<any>(api.get(`/buildings/${id}`)),

  createAssessment: (payload: { buildingId: string; name?: string }) => api.post('/assessments', payload),
  getAssessment: (id: string) => unwrap<{ id: string; buildingId: string; results?: EvaluationResult }>(api.get(`/assessments/${id}`)),
  evaluate: (payload: { buildingType?: string; scores?: Record<string, number> }) => unwrap<EvaluationResult>(api.post('/evaluate', payload)),

  getCriteria: () => unwrap<Criterion[]>(api.get('/criteria')),
  createCriterion: (payload: {
    code: string;
    name: string;
    definition: string;
    justification?: string;
    value: number;
    disability: number;
    dimension: number;
    levels: string[];
  }) => api.post('/criteria', payload),
  getBuildingTypes: () => unwrap<BuildingTypesResponse>(api.get('/building-types')),

  getAssessmentDimensions: () => unwrap<any[]>(api.get('/assessment-dimensions')),
  getDisabilityTypes: () => unwrap<any[]>(api.get('/disability-types')),
  getNebThresholds: () => unwrap<any[]>(api.get('/neb-thresholds')),

  getReports: () => api.get('/reports'),
};
  
