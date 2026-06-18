// Centralized localStorage keys and helpers — used by dashboard & certification pages.

export const STORAGE_KEY = "accessibility-assessment-state";
export const CERTIFICATION_KEY = "certification-state";

export interface AssessmentState {
  buildingType: string;
  scores: Record<string, number>;
}

export function loadState(): AssessmentState | null {
  try {
    const raw = localStorage.getItem(CERTIFICATION_KEY) ?? localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveState(buildingType: string, scores: Record<string, number>) {
  try {
    const payload = JSON.stringify({ buildingType, scores });
    localStorage.setItem(STORAGE_KEY, payload);
    localStorage.setItem(CERTIFICATION_KEY, payload);
  } catch { /* quota exceeded — ignore */ }
}
