export type BuildingType =
  | "Residential Buildings"
  | "Commercial Buildings"
  | "Industrial Buildings"
  | "Institutional Buildings"
  | "Religious Buildings"
  | "Recreational Buildings"
  | "Special - Purpose Buildings";

export const BUILDING_TYPES: BuildingType[] = [
  "Residential Buildings",
  "Commercial Buildings",
  "Industrial Buildings",
  "Institutional Buildings",
  "Religious Buildings",
  "Recreational Buildings",
  "Special - Purpose Buildings",
];

export const BUILDING_TYPE_LABELS: Record<BuildingType, string> = {
  "Residential Buildings": "Residential",
  "Commercial Buildings": "Commercial",
  "Industrial Buildings": "Industrial",
  "Institutional Buildings": "Institutional",
  "Religious Buildings": "Religious",
  "Recreational Buildings": "Recreational",
  "Special - Purpose Buildings": "Special Purpose",
};

export const DEFAULT_BUILDING_TYPE: BuildingType = "Commercial Buildings";
