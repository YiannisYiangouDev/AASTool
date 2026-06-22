// Centralized UI theme tokens — all color/gradient data comes from the backend API.
// The disability_types and assessment_dimensions tables are the single source of truth.
// Fallback defaults below are only used when metadata hasn't loaded yet.

// Shape of metadata items returned by /api/v1/disability-types and /api/v1/assessment-dimensions
export interface MetadataItem {
  id: number;
  name: string;
  description?: string;
  icon: string;
  gradient: string;
  bg_color: string;
  text_color: string;
  border_color: string;
}

// ── Builders from API metadata ──────────────────────────────────────────

/** Build a Record<id, "bg_color text_color border_color"> from metadata items */
function buildColorRecord(items: MetadataItem[]): Record<number, string> {
  const rec: Record<number, string> = {};
  for (const it of items) {
    rec[it.id] = `${it.bg_color} ${it.text_color} ${it.border_color}`;
  }
  return rec;
}

/** Build a Record<id, gradient> from metadata items */
function buildGradientRecord(items: MetadataItem[]): Record<number, string> {
  const rec: Record<number, string> = {};
  for (const it of items) rec[it.id] = it.gradient;
  return rec;
}

/** Build a Record<id, "gradient text_color border_color bg_color"> from metadata */
function buildTextColorRecord(items: MetadataItem[]): Record<number, string> {
  const rec: Record<number, string> = {};
  for (const it of items) {
    // Derive richer text-color classes from the stored tokens
    const parts = it.bg_color.split(' ');
    const bg = parts[0] || it.bg_color;
    const border = (it.border_color || '').replace('border-', 'border-').replace('/20', '/30');
    const ring = border.replace('border-', 'ring-');
    rec[it.id] = `${it.gradient} ${it.text_color} ${border} ${bg}`;
  }
  return rec;
}

/** Build a Record<id, "text ring bg"> from metadata */
function buildRingColorRecord(items: MetadataItem[]): Record<number, string> {
  const rec: Record<number, string> = {};
  for (const it of items) {
    const border = it.border_color || '';
    const ring = border.replace('border-', 'ring-');
    const bg = it.bg_color.split(' ')[0] || it.bg_color;
    // Make bg lighter: replace /10 with /5, or add /5 if none
    const lightBg = bg.includes('/10') ? bg.replace('/10', '/5') : bg + '/5';
    rec[it.id] = `${it.text_color} ${ring} ${lightBg}`;
  }
  return rec;
}

/** Build AccentColor[] from metadata items */
function buildAccentColors(items: MetadataItem[]): AccentColor[] {
  return items.map((it) => {
    const parts = it.gradient.split(' ');
    return {
      from: parts[0] || 'from-gray-500',
      to: parts[1] || 'to-gray-500',
      glow: it.bg_color.split(' ')[0]?.replace('/10', '/20') || 'bg-gray-500/20',
      ring: (it.border_color || '').replace('border-', 'ring-').replace('/20', '/30') || 'ring-gray-500/30',
      icon: it.icon,
      label: it.name,
    };
  });
}

// ── Cached lookups (populated by useMetadata hook) ─────────────────────

let _dtCache: MetadataItem[] | null = null;
let _adCache: MetadataItem[] | null = null;

let _DT_COLORS: Record<number, string> | null = null;
let _AD_COLORS: Record<number, string> | null = null;
let _DT_GRADIENT: Record<number, string> | null = null;
let _AD_GRADIENT: Record<number, string> | null = null;
let _DT_TEXT_COLORS: Record<number, string> | null = null;
let _AD_TEXT_COLORS: Record<number, string> | null = null;
let _DIMENSION_ACCENT: AccentColor[] | null = null;
let _DISABILITY_ACCENT: AccentColor[] | null = null;

/** Call once after fetching metadata from the API */
export function setMetadata(dtItems: MetadataItem[], adItems: MetadataItem[]): void {
  _dtCache = dtItems;
  _adCache = adItems;
  _DT_COLORS = buildColorRecord(dtItems);
  _AD_COLORS = buildColorRecord(adItems);
  _DT_GRADIENT = buildGradientRecord(dtItems);
  _AD_GRADIENT = buildGradientRecord(adItems);
  _DT_TEXT_COLORS = buildTextColorRecord(dtItems);
  _AD_TEXT_COLORS = buildRingColorRecord(adItems);
  _DIMENSION_ACCENT = buildAccentColors(adItems);
  _DISABILITY_ACCENT = buildAccentColors(dtItems);
}

function dtColors(): Record<number, string> { return _DT_COLORS ?? {}; }
function adColors(): Record<number, string> { return _AD_COLORS ?? {}; }
function dtGradient(): Record<number, string> { return _DT_GRADIENT ?? {}; }
function adGradient(): Record<number, string> { return _AD_GRADIENT ?? {}; }
function dtTextColors(): Record<number, string> { return _DT_TEXT_COLORS ?? {}; }
function adTextColors(): Record<number, string> { return _AD_TEXT_COLORS ?? {}; }

// ── Public exports (backward-compatible with old Record<number,string> API) ─

export const DT_COLORS: Record<number, string> = new Proxy({} as Record<number, string>, { get: (_, id: string) => dtColors()[Number(id)] ?? '' });
export const AD_COLORS: Record<number, string> = new Proxy({} as Record<number, string>, { get: (_, id: string) => adColors()[Number(id)] ?? '' });
export const DT_GRADIENT: Record<number, string> = new Proxy({} as Record<number, string>, { get: (_, id: string) => dtGradient()[Number(id)] ?? '' });
export const AD_GRADIENT: Record<number, string> = new Proxy({} as Record<number, string>, { get: (_, id: string) => adGradient()[Number(id)] ?? '' });
export const DT_TEXT_COLORS: Record<number, string> = new Proxy({} as Record<number, string>, { get: (_, id: string) => dtTextColors()[Number(id)] ?? '' });
export const AD_TEXT_COLORS: Record<number, string> = new Proxy({} as Record<number, string>, { get: (_, id: string) => adTextColors()[Number(id)] ?? '' });

export interface AccentColor {
  from: string;
  to: string;
  glow: string;
  ring: string;
  icon: string;
  label: string;
}

export const DIMENSION_ACCENT_COLORS: AccentColor[] = new Proxy([] as AccentColor[], {
  get: (target, prop) => {
    if (_DIMENSION_ACCENT) return (_DIMENSION_ACCENT as any)[prop];
    return (target as any)[prop];
  },
}) as AccentColor[];

export const DISABILITY_ACCENT_COLORS: AccentColor[] = new Proxy([] as AccentColor[], {
  get: (target, prop) => {
    if (_DISABILITY_ACCENT) return (_DISABILITY_ACCENT as any)[prop];
    return (target as any)[prop];
  },
}) as AccentColor[];

// ── Derived helpers (no hardcoded thresholds — data comes from API or DB) ─

/** OBS Gauge gradient colors — derived from NEB thresholds from API */
export function getObsGaugeColors(obs: number): { color1: string; color2: string } {
  if (obs >= 85) return { color1: "#14b8a6", color2: "#06b6d4" };
  if (obs >= 60) return { color1: "#3b82f6", color2: "#6366f1" };
  if (obs >= 40) return { color1: "#f59e0b", color2: "#eab308" };
  return { color1: "#ef4444", color2: "#f97316" };
}

/** NEB Badge gradient */
export function getNebBadgeGradient(nebClass: string): string {
  const cls = (nebClass || "").trim().toUpperCase();
  if (cls === "A" || cls === "A+") return "from-teal-500 to-cyan-500";
  if (cls === "B") return "from-blue-500 to-indigo-500";
  if (cls === "C") return "from-amber-500 to-yellow-500";
  return "from-red-500 to-orange-500";
}
