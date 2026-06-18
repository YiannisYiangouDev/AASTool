// Centralized UI theme tokens — single source of truth for all color/gradient mappings.
// DT = Disability Type, AD = Assessment Dimension

export const DT_COLORS: Record<number, string> = {
  1: "from-teal-500/10 to-cyan-500/10 text-teal-300 border-teal-500/20",
  2: "from-blue-500/10 to-indigo-500/10 text-blue-300 border-blue-500/20",
  3: "from-violet-500/10 to-purple-500/10 text-purple-300 border-purple-500/20",
  4: "from-amber-500/10 to-orange-500/10 text-orange-300 border-amber-500/20",
  5: "from-rose-500/10 to-pink-500/10 text-pink-300 border-rose-500/20",
};

export const AD_COLORS: Record<number, string> = {
  1: "from-teal-500/10 to-emerald-500/10 text-emerald-300 border-emerald-500/20",
  2: "from-sky-500/10 to-blue-500/10 text-sky-300 border-sky-500/20",
  3: "from-indigo-500/10 to-violet-500/10 text-indigo-300 border-indigo-500/20",
  4: "from-orange-500/10 to-amber-500/10 text-amber-300 border-amber-500/20",
  5: "from-pink-500/10 to-rose-500/10 text-rose-300 border-rose-500/20",
};

export const DT_GRADIENT: Record<number, string> = {
  1: "from-teal-500 to-cyan-400",
  2: "from-blue-500 to-indigo-400",
  3: "from-violet-500 to-purple-400",
  4: "from-amber-500 to-orange-400",
  5: "from-rose-500 to-pink-400",
};

export const AD_GRADIENT: Record<number, string> = {
  1: "from-teal-500 to-emerald-400",
  2: "from-sky-500 to-blue-400",
  3: "from-indigo-500 to-violet-400",
  4: "from-orange-500 to-amber-400",
  5: "from-pink-500 to-rose-400",
};

export const DT_TEXT_COLORS: Record<number, string> = {
  1: "from-teal-400 to-cyan-500 text-teal-300 border-teal-500/30 bg-teal-500/10",
  2: "from-blue-400 to-indigo-500 text-blue-300 border-blue-500/30 bg-blue-500/10",
  3: "from-violet-400 to-purple-500 text-violet-300 border-violet-500/30 bg-violet-500/10",
  4: "from-amber-400 to-orange-500 text-amber-300 border-amber-500/30 bg-amber-500/10",
  5: "from-rose-400 to-pink-500 text-rose-300 border-rose-500/30 bg-rose-500/10",
};

export const AD_TEXT_COLORS: Record<number, string> = {
  1: "text-teal-400 ring-teal-500/20 bg-teal-500/5",
  2: "text-blue-400 ring-blue-500/20 bg-blue-500/5",
  3: "text-violet-400 ring-violet-500/20 bg-violet-500/5",
  4: "text-amber-400 ring-amber-500/20 bg-amber-500/5",
  5: "text-rose-400 ring-rose-500/20 bg-rose-500/5",
};

export interface AccentColor {
  from: string;
  to: string;
  glow: string;
  ring: string;
  icon: string;
  label: string;
}

// Used by building, disability, and dimensions listing pages
export const DIMENSION_ACCENT_COLORS: AccentColor[] = [
  { from: "from-teal-500", to: "to-emerald-500", glow: "bg-teal-500/20", ring: "ring-teal-500/30", icon: "🏗️", label: "Spatial & Physical" },
  { from: "from-blue-500", to: "to-cyan-500", glow: "bg-blue-500/20", ring: "ring-blue-500/30", icon: "🛡️", label: "Safety & Comfort" },
  { from: "from-violet-500", to: "to-purple-500", glow: "bg-violet-500/20", ring: "ring-violet-500/30", icon: "🧠", label: "Cognitive & Navigation" },
  { from: "from-amber-500", to: "to-orange-500", glow: "bg-amber-500/20", ring: "ring-amber-500/30", icon: "💻", label: "Digital & Smart" },
  { from: "from-rose-500", to: "to-pink-500", glow: "bg-rose-500/20", ring: "ring-rose-500/30", icon: "🤝", label: "Social & Human" },
];

export const DISABILITY_ACCENT_COLORS: AccentColor[] = [
  { from: "from-teal-500", to: "to-emerald-500", glow: "bg-teal-500/20", ring: "ring-teal-500/30", icon: "🦽", label: "Physical" },
  { from: "from-blue-500", to: "to-cyan-500", glow: "bg-blue-500/20", ring: "ring-blue-500/30", icon: "👁️", label: "Sensory" },
  { from: "from-violet-500", to: "to-purple-500", glow: "bg-violet-500/20", ring: "ring-violet-500/30", icon: "🧩", label: "Cognitive & Neuro" },
  { from: "from-amber-500", to: "to-orange-500", glow: "bg-amber-500/20", ring: "ring-amber-500/30", icon: "💬", label: "Communication" },
  { from: "from-rose-500", to: "to-pink-500", glow: "bg-rose-500/20", ring: "ring-rose-500/30", icon: "🌐", label: "Multiple / Situational" },
];

// OBS Gauge gradient colors — derived from OBS percentage thresholds (used in SVG arc)
export function getObsGaugeColors(obs: number): { color1: string; color2: string } {
  if (obs >= 85) return { color1: "#14b8a6", color2: "#06b6d4" };
  if (obs >= 60) return { color1: "#3b82f6", color2: "#6366f1" };
  if (obs >= 40) return { color1: "#f59e0b", color2: "#eab308" };
  return { color1: "#ef4444", color2: "#f97316" };
}

// NEB Badge gradient — derived from NEB class returned by backend (no hardcoded thresholds)
export function getNebBadgeGradient(nebClass: string): string {
  const cls = (nebClass || "").trim().toUpperCase();
  if (cls === "A" || cls === "A+") return "from-teal-500 to-cyan-500";
  if (cls === "B") return "from-blue-500 to-indigo-500";
  if (cls === "C") return "from-amber-500 to-yellow-500";
  return "from-red-500 to-orange-500";
}
