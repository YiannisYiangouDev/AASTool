"use client";

import React, {
  Fragment,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from "react";

import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import api from "../../lib/api/client";

import {
  BuildingType,
  BUILDING_TYPES,
  BUILDING_TYPE_LABELS,
  DEFAULT_BUILDING_TYPE,
} from "../../types/building-types";

import type { EvaluationResult, Criterion } from "../../types";
import { useMetadata } from "../../lib/hooks/useMetadata";

const DT_COLORS: Record<number, string> = {
  1: "from-teal-500/10 to-cyan-500/10 text-teal-300 border-teal-500/20",
  2: "from-blue-500/10 to-indigo-500/10 text-blue-300 border-blue-500/20",
  3: "from-violet-500/10 to-purple-500/10 text-purple-300 border-purple-500/20",
  4: "from-amber-500/10 to-orange-500/10 text-orange-300 border-amber-500/20",
  5: "from-rose-500/10 to-pink-500/10 text-pink-300 border-rose-500/20",
};

const AD_COLORS: Record<number, string> = {
  1: "from-teal-500/10 to-emerald-500/10 text-emerald-300 border-emerald-500/20",
  2: "from-sky-500/10 to-blue-500/10 text-sky-300 border-sky-500/20",
  3: "from-indigo-500/10 to-violet-500/10 text-indigo-300 border-indigo-500/20",
  4: "from-orange-500/10 to-amber-500/10 text-amber-300 border-amber-500/20",
  5: "from-pink-500/10 to-rose-500/10 text-rose-300 border-rose-500/20",
};

type CriterionScore = Criterion & { score: number; is: number };
type FilterMode = "all" | `dt${1 | 2 | 3 | 4 | 5}` | `ad${1 | 2 | 3 | 4 | 5}` | `ec${1 | 2 | 3 | 4 | 5}`;

const STORAGE_KEY = "certification-state";
const DASHBOARD_KEY = "accessibility-assessment-state";

async function fetchEvaluate(
  buildingType: string,
  scores?: Record<string, number>,
): Promise<EvaluationResult> {
  const res = await api.post("/evaluate", {
    buildingType,
    scores: scores && Object.keys(scores).length > 0 ? scores : undefined,
  });
  const data = res.data as any;
  return data?.result || data;
}

function saveState(
  buildingType: BuildingType,
  scores: Record<string, number>,
) {
  const payload = JSON.stringify({ buildingType, scores });
  localStorage.setItem(STORAGE_KEY, payload);
  localStorage.setItem(DASHBOARD_KEY, payload);
}

function loadState(): {
  buildingType: BuildingType;
  scores: Record<string, number>;
} | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(DASHBOARD_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const RefreshIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function CertificationPage() {
  const { dtLabels, adLabels } = useMetadata();
  const [buildingType, setBuildingType] = useState<BuildingType>(
    DEFAULT_BUILDING_TYPE,
  );
  const [criteria, setCriteria] = useState<CriterionScore[]>([]);
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<EvaluationResult>({
    obs: 0,
    nebClass: "",
    nebEquivalent: "–",
    nebMeaning: "Loading…",
    nebScore: 0,
    averageRawScore: 0,
    avgRawScoreByDT: {},
    avgRawScoreByAD: {},
    strengths: [],
    weaknesses: [],
    tisByDT: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    cisByAD: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    criteria: [],
  });

  useEffect(() => {
    const saved = loadState();
    const bt = saved?.buildingType ?? DEFAULT_BUILDING_TYPE;
    const scores = saved?.scores ?? {};
    setBuildingType(bt);

    fetchEvaluate(bt, scores)
      .then((r) => {
        setCriteria(r.criteria as CriterionScore[]);
        setResults(r);
      })
      .catch((err) => {
        console.error("Failed to load evaluation from backend:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!criteria || criteria.length === 0) return;
    const scores: Record<string, number> = {};
    for (const c of criteria) scores[c.code] = c.score;
    saveState(buildingType, scores);
  }, [buildingType, criteria]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.newValue) return;
      if (e.key !== STORAGE_KEY && e.key !== DASHBOARD_KEY) return;
      try {
        const saved = JSON.parse(e.newValue);
        setBuildingType((prev) =>
          prev !== saved.buildingType ? saved.buildingType : prev,
        );
        fetchEvaluate(saved.buildingType, saved.scores).then((r) => {
          setCriteria(r.criteria as CriterionScore[]);
          setResults(r);
        });
      } catch {}
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const updateScore = useCallback(
    (code: string, score: number) => {
      setCriteria((prev) =>
        prev.map((c) =>
          c.code === code
            ? { ...c, score, is: Number((c.value * score).toFixed(4)) }
            : c,
        ),
      );

      const saved = loadState();
      const scores: Record<string, number> = { ...saved?.scores };
      scores[code] = score;
      saveState(buildingType, scores);

      fetchEvaluate(buildingType, scores)
        .then((r) => {
          setCriteria(r.criteria as CriterionScore[]);
          setResults(r);
        })
        .catch(() => {
          /* keep optimistic state on error */
        });
    },
    [buildingType],
  );

  const resetScores = useCallback(() => {
    fetchEvaluate(buildingType, {}).then((r) => {
      setCriteria(r.criteria as CriterionScore[]);
      setResults(r);
    });
  }, [buildingType]);

  const toggleExpand = useCallback((code: string) => {
    setExpandedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  }, []);

  const visibleCriteria = useMemo(() => {
    let list = criteria || [];

    if (filterMode.startsWith("ec")) {
      const prefix = "EC" + filterMode.slice(2);
      list = list.filter((c) => c.code.startsWith(prefix));
    } else if (filterMode.startsWith("dt")) {
      const dt = Number(filterMode.slice(2));
      list = list.filter((c) => c.disability === dt);
    } else if (filterMode.startsWith("ad")) {
      const ad = Number(filterMode.slice(2));
      list = list.filter((c) => c.dimension === ad);
    }

    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.code.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.definition.toLowerCase().includes(query),
      );
    }

    return list;
  }, [criteria, filterMode, searchQuery]);

  const obs = Number.isFinite(results.obs) ? results.obs : 0;

  // Derive color from NEB class returned by backend (no hardcoded thresholds)
  const nebClass = (results.nebClass || "").trim().toUpperCase();
  const nebColorGradient =
    nebClass === "A" || nebClass === "A+"
      ? "from-teal-500 to-cyan-500"
      : nebClass === "B"
        ? "from-blue-500 to-indigo-500"
        : nebClass === "C"
          ? "from-amber-500 to-yellow-500"
          : "from-red-500 to-orange-500";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b1120] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading evaluation data from backend…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-white">
      <Header />

      {/* Ambient background glows */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      >
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute top-1/3 left-0 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <main
        id="main-content"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24"
      >
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                            bg-teal-500/10 ring-1 ring-teal-500/25 text-teal-400
                            text-xs font-semibold tracking-widest uppercase mb-4"
            >
              Evaluation Hub
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              Certification{" "}
              <span className="bg-gradient-to-r from-teal-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
                Engine
              </span>
            </h1>
            <p className="text-slate-400 mt-2 text-base max-w-xl">
              Assign scores to specific evaluation criteria, recalculate compliance
              models, and compile official EN 17210 assessment certification metrics.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={resetScores}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700
                         text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all"
              title="Reset all criteria to default scores"
            >
              <RefreshIcon /> Reset
            </button>
          </div>
        </div>

        {/* ── Building Type and KPIs ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Profile Select */}
          <div className="lg:col-span-1 bg-white/[0.03] rounded-3xl border border-white/8 p-6 flex flex-col justify-center">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Building Profile
            </label>
            <select
              value={buildingType}
              title="Building profile type"
              onChange={(e) => {
                const bt = e.target.value as BuildingType;
                setBuildingType(bt);
                const saved = loadState();
                fetchEvaluate(bt, saved?.scores ?? {}).then((r) => {
                  setCriteria(r.criteria as CriterionScore[]);
                  setResults(r);
                });
              }}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl px-4 py-3.5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition-all"
            >
              {BUILDING_TYPES.map((type) => (
                <option key={type} value={type}>
                  {BUILDING_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
              Changing building profiles re-weights disability factors dynamically.
            </p>
          </div>

          {/* KPIs */}
          <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "OBS %",
                value: `${results.obs}%`,
                sub: "Overall Score",
                color: "text-teal-400",
              },
              {
                label: "NEB Class",
                value: results.nebClass,
                sub: results.nebMeaning,
                color: "text-blue-400",
              },
              {
                label: "Access level",
                value: results.nebEquivalent,
                sub: "Equivalent Rank",
                color: "text-indigo-400",
              },
              {
                label: "Avg Score",
                value: `${results.averageRawScore}`,
                sub: "Criterion Mean",
                color: "text-cyan-400",
              },
            ].map(({ label, value, sub, color }) => (
              <div
                key={label}
                className="bg-white/[0.03] rounded-2xl border border-white/8 p-5 flex flex-col justify-between"
              >
                <p className="text-slate-500 text-xs mb-2 uppercase tracking-wider">{label}</p>
                <p className={`text-2xl sm:text-3xl font-black ${color} tabular-nums`}>
                  {value}
                </p>
                <p className="text-slate-600 text-[10px] mt-1 leading-tight">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Filters & Search ────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          {/* Filters */}
          <div className="w-full md:w-auto flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all
                ${
                  filterMode === "all"
                    ? "bg-teal-500 text-black shadow-lg shadow-teal-500/20"
                    : "bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white"
                }`}
            >
              All Focuses
            </button>

            {/* Code Filters */}
            {[1, 2, 3, 4, 5].map((ec) => (
              <button
                key={`ec${ec}`}
                onClick={() => setFilterMode(`ec${ec}` as FilterMode)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all
                  ${
                    filterMode === `ec${ec}`
                      ? "bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg shadow-cyan-500/20"
                      : "bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white"
                  }`}
                title={`Code EC${ec}.x.x — ${dtLabels[ec]}`}
              >
                EC{ec}
              </button>
            ))}

            {/* Divider */}
            <span className="w-px h-6 bg-white/10 mx-1 self-center" />

            {/* Disability Filters */}
            {[1, 2, 3, 4, 5].map((dt) => (
              <button
                key={`dt${dt}`}
                onClick={() => setFilterMode(`dt${dt}` as FilterMode)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all
                  ${
                    filterMode === `dt${dt}`
                      ? "bg-gradient-to-r from-teal-500 to-blue-500 text-white shadow-lg shadow-teal-500/20"
                      : "bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white"
                  }`}
                title={dtLabels[dt]}
              >
                DT{dt}
              </button>
            ))}

            {/* Dimension Filters */}
            {[1, 2, 3, 4, 5].map((ad) => (
              <button
                key={ad}
                onClick={() => setFilterMode(`ad${ad}` as FilterMode)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all
                  ${
                    filterMode === `ad${ad}`
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20"
                      : "bg-white/[0.03] border border-white/5 text-slate-400 hover:text-white"
                  }`}
                title={adLabels[ad]}
              >
                AD{ad}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500 pointer-events-none">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search criteria code or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-400 transition-all"
            />
          </div>
        </div>

        {/* Selected Filter Info */}
        {filterMode !== "all" && (
          <div className="mb-4 p-3 bg-white/[0.02] border border-white/5 rounded-2xl text-xs text-slate-400 flex items-center gap-2">
            <span className="font-semibold text-white uppercase">Active Filter:</span>
            {filterMode.startsWith("ec") ? (
              <span>Code EC{filterMode.slice(2)}.x.x — {dtLabels[Number(filterMode.slice(2))]}</span>
            ) : filterMode.startsWith("dt") ? (
              <span>Disability Type {filterMode.slice(2)} — {dtLabels[Number(filterMode.slice(2))]}</span>
            ) : (
              <span>Assessment Dimension {filterMode.slice(2)} — {adLabels[Number(filterMode.slice(2))]}</span>
            )}
          </div>
        )}

        {/* ── Table / Grid ────────────────────────────────────────────── */}
        <div className="overflow-x-auto rounded-3xl border border-white/8 bg-white/[0.02] backdrop-blur-sm shadow-xl">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 text-slate-400 bg-white/[0.01]">
                <th className="px-6 py-4 text-left font-semibold tracking-wider text-xs uppercase w-20">Code</th>
                <th className="px-6 py-4 text-left font-semibold tracking-wider text-xs uppercase">Criterion Description</th>
                <th className="px-6 py-4 text-center font-semibold tracking-wider text-xs uppercase w-32">Assign Score</th>
                <th className="px-6 py-4 text-right font-semibold tracking-wider text-xs uppercase w-24">Weight</th>
                <th className="px-6 py-4 text-right font-semibold tracking-wider text-xs uppercase w-28">IS(ij)</th>
              </tr>
            </thead>

            <tbody>
              {visibleCriteria.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No criteria match the active search query or filter.
                  </td>
                </tr>
              ) : (
                visibleCriteria.map((c) => {
                  const isExpanded = expandedCodes.has(c.code);

                  const scoreColors = [
                    "text-red-400",
                    "text-orange-400",
                    "text-amber-400",
                    "text-blue-400",
                    "text-teal-400",
                  ];

                  return (
                    <Fragment key={c.code}>
                      <tr
                        onClick={() => toggleExpand(c.code)}
                        className={`border-b border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors duration-150 ${isExpanded ? "bg-white/[0.02]" : ""}`}
                      >
                        <td className="px-6 py-4 font-mono text-xs text-slate-400">{c.code}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-white text-sm">{c.name}</span>
                            <span className="text-[10px] text-slate-500 mt-1 flex flex-wrap gap-2">
                              <span className={`px-2 py-0.5 rounded border bg-gradient-to-br ${DT_COLORS[c.disability]}`}>
                                DT{c.disability} Focus
                              </span>
                              <span className={`px-2 py-0.5 rounded border bg-gradient-to-br ${AD_COLORS[c.dimension]}`}>
                                AD{c.dimension} Focus
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={c.score}
                            onChange={(e) => updateScore(c.code, Number(e.target.value))}
                            title={`Score for ${c.code}`}
                            className={`bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-teal-400 ${scoreColors[c.score - 1]}`}
                          >
                            {[1, 2, 3, 4, 5].map((s) => (
                              <option key={s} value={s} className="bg-slate-950 font-bold">
                                Level {s}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400 tabular-nums">
                          {(c.value * 100).toFixed(0)}%
                        </td>
                        <td className="px-6 py-4 text-right text-teal-400 font-mono font-bold tabular-nums">
                          {c.is.toFixed(4)}
                        </td>
                      </tr>

                      {/* Expandable details row */}
                      {isExpanded && (
                        <tr className="bg-white/[0.01] border-b border-white/5">
                          <td colSpan={5} className="px-8 py-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              <div className="md:col-span-2 space-y-4">
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    Criterion Definition
                                  </h4>
                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    {c.definition}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    Scoring Justification
                                  </h4>
                                  <p className="text-xs text-slate-400 leading-relaxed">
                                    {c.justification}
                                  </p>
                                </div>
                              </div>

                              <div className="md:col-span-1 border-l border-white/5 pl-6 space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                  Progressive Automation Levels
                                </h4>
                                <div className="space-y-2">
                                  {c.levels.map((levelText: string, idx: number) => {
                                    const lvl = idx + 1;
                                    const isCurrent = c.score === lvl;
                                    return (
                                      <div
                                        key={lvl}
                                        className={`p-2 rounded-lg text-[10px] leading-relaxed transition-all
                                          ${
                                            isCurrent
                                              ? "bg-teal-500/10 ring-1 ring-teal-500/30 text-teal-300 font-medium"
                                              : "bg-white/[0.01] border border-white/5 text-slate-500"
                                          }`}
                                      >
                                        <span className="font-bold mr-1.5">L{lvl}:</span>
                                        {levelText}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Mobile navigation tab bar */}
      <BottomNav />
    </div>
  );
}
