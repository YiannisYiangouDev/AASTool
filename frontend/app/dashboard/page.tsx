"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import api from "../../lib/api/client";
import { endpoints } from "../../lib/api/endpoints";
import { fadeInUp, staggerContainer, staggerItem } from "../../lib/animations";

import {
  BuildingType,
  BUILDING_TYPE_LABELS,
  DEFAULT_BUILDING_TYPE,
} from "../../types/building-types";
import { useMetadata } from "../../lib/hooks/useMetadata";

import type { EvaluationResult, Criterion } from "../../types";

const STORAGE_KEY = "accessibility-assessment-state";
const CERTIFICATION_KEY = "certification-state";

const DT_GRADIENT: Record<number, string> = {
  1: "from-teal-500 to-cyan-400",
  2: "from-blue-500 to-indigo-400",
  3: "from-violet-500 to-purple-400",
  4: "from-amber-500 to-orange-400",
  5: "from-rose-500 to-pink-400",
};

const AD_GRADIENT: Record<number, string> = {
  1: "from-teal-500 to-emerald-400",
  2: "from-sky-500 to-blue-400",
  3: "from-indigo-500 to-violet-400",
  4: "from-orange-500 to-amber-400",
  5: "from-pink-500 to-rose-400",
};

type CriterionScore = Criterion & { score: number; is: number };

async function fetchEvaluate(
  buildingType: string,
  scores?: Record<string, number>,
): Promise<EvaluationResult> {
  const payload: any = { buildingType };

  if (scores && Object.keys(scores).length > 0) {
    payload.scores = scores;
  }

  const res = await api.post<any>("/evaluate", payload);
  return (res.data as any)?.result || res.data;
}

function loadState():
  | {
    buildingType: BuildingType;
    scores: Record<string, number>;
  }
  | null {
  try {
    // Check certification key first (where criteria updates land),
    // then fall back to dashboard-specific key
    const raw = localStorage.getItem(CERTIFICATION_KEY) ?? localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(buildingType: BuildingType, scores: Record<string, number>) {
  try {
    const payload = JSON.stringify({ buildingType, scores });
    localStorage.setItem(STORAGE_KEY, payload);
    localStorage.setItem(CERTIFICATION_KEY, payload);
  } catch { }
}

function OBSGauge({ value }: Readonly<{ value: number }>) {
  const radius = 80;
  const stroke = 12;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const dashOffset = circumference - (progress / 100) * circumference;

  const gradId = "obs-gauge-grad";
  let color1 = "#ef4444";
  let color2 = "#f97316";

  if (value >= 85) {
    color1 = "#14b8a6";
    color2 = "#06b6d4";
  } else if (value >= 60) {
    color1 = "#3b82f6";
    color2 = "#6366f1";
  } else if (value >= 40) {
    color1 = "#f59e0b";
    color2 = "#eab308";
  }

  return (
    <svg
      width="200"
      height="200"
      viewBox="0 0 200 200"
      className="mx-auto"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color1} />
          <stop offset="100%" stopColor={color2} />
        </linearGradient>
      </defs>
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={stroke}
      />
      <circle
        cx="100"
        cy="100"
        r={radius}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        transform="rotate(-90 100 100)"
        className="transition-all duration-700 ease-out"
      />
      <text
        x="100"
        y="92"
        textAnchor="middle"
        className="fill-white text-[32px] font-black"
      >
        {value}%
      </text>
      <text
        x="100"
        y="118"
        textAnchor="middle"
        className="fill-slate-400 text-xs"
      >
        OBS Score
      </text>
    </svg>
  );
}

const ArrowRight = () => (
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
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

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
    aria-hidden="true"
  >
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
  </svg>
);

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function ServerStatusWidget() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['server-health'],
    queryFn: () => endpoints.healthCheck(),
    refetchInterval: 30_000,
    retry: 2,
    staleTime: 15_000,
  });

  const status = data?.status ?? 'unknown';
  const db = data?.database ?? 'unknown';
  const uptime = data?.uptime ?? 0;
  const latency = data?.dbLatencyMs;
  const version = data?.version;

  const statusColor =
    status === 'ok'
      ? 'bg-teal-400'
      : status === 'degraded'
        ? 'bg-amber-400'
        : 'bg-red-400';

  const dbColor =
    db === 'connected'
      ? 'bg-teal-400'
      : db === 'disconnected'
        ? 'bg-red-400'
        : 'bg-slate-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="flex flex-wrap items-center gap-3 sm:gap-5 px-5 py-3 rounded-xl border border-white/[0.05] bg-white/[0.01] backdrop-blur-sm"
    >
      {/* Title */}
      <div className="flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
        </svg>
        <span className="text-[10px] font-semibold tracking-widest uppercase text-slate-600">Status</span>
      </div>

      {/* API */}
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${statusColor} ${status === 'ok' ? 'animate-pulse' : ''}`} />
        <span className="text-[11px] text-slate-400">API</span>
        <span className="text-[11px] text-slate-300 font-medium capitalize">{status}</span>
      </div>

      {/* DB */}
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${dbColor} ${db === 'connected' ? 'animate-pulse' : ''}`} />
        <span className="text-[11px] text-slate-400">DB</span>
        <span className="text-[11px] text-slate-300 font-medium capitalize">{db}</span>
        {latency != null && (
          <span className="text-[10px] text-slate-500 tabular-nums ml-0.5">{latency}ms</span>
        )}
      </div>

      {/* Uptime */}
      <div className="flex items-center gap-1">
        <svg className="w-3 h-3 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-[11px] text-slate-500 tabular-nums">{formatUptime(uptime)}</span>
      </div>

      {/* Version */}
      {version && (
        <span className="text-[10px] text-slate-600 font-mono ml-auto">v{version}</span>
      )}

      {/* Loading / Error indicators */}
      {isLoading && (
        <span className="text-[10px] text-slate-500 animate-pulse ml-auto">polling…</span>
      )}
      {isError && (
        <span className="text-[10px] text-rose-400 ml-auto font-medium">offline</span>
      )}
    </motion.div>
  );
}


export default function DashboardPage() {
  const { dtLabels, adLabels } = useMetadata();
  const [buildingType, setBuildingType] = useState<BuildingType>(
    DEFAULT_BUILDING_TYPE,
  );
  const [criteria, setCriteria] = useState<CriterionScore[]>([]);
  const [loading, setLoading] = useState(true);

  const [simTarget, setSimTarget] = useState<string>("all");
  const [simScore, setSimScore] = useState<number>(5);

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

  const obs = Number.isFinite(results.obs) ? results.obs : 0;

  useEffect(() => {
    const saved = loadState();
    const bt = saved?.buildingType ?? DEFAULT_BUILDING_TYPE;
    setBuildingType(bt);

    fetchEvaluate(bt, saved?.scores ?? {})
      .then((r) => {
        setCriteria((r.criteria as CriterionScore[]) || []);
        setResults(r);
      })
      .catch((err) => {
        console.error("Failed to load evaluation:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      // Listen for both certification and dashboard keys
      if (!e.newValue) return;
      if (e.key !== STORAGE_KEY && e.key !== CERTIFICATION_KEY) return;
      try {
        const saved = JSON.parse(e.newValue);
        setBuildingType(saved.buildingType);
        fetchEvaluate(saved.buildingType, saved.scores)
          .then((r) => {
            setCriteria(r.criteria as CriterionScore[]);
            setResults(r);
          })
          .catch((err) => {
            console.error("Storage sync failed:", err);
          });
      } catch { }
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const scoreDistribution = results.scoreDistribution || {};
  const avgByDT = results.avgRawScoreByDT || {};
  const avgByAD = results.avgRawScoreByAD || {};
  const strengths = results.strengths || [];
  const weaknesses = results.weaknesses || [];

  const applySimulation = useCallback(() => {
    const saved = loadState();
    const scores: Record<string, number> = { ...(saved?.scores ?? {}) };

    for (const c of criteria) {
      let match = false;
      if (simTarget === "all") match = true;
      else if (simTarget.startsWith("dt"))
        match = c.disability === Number(simTarget.slice(2));
      else if (simTarget.startsWith("ad"))
        match = c.dimension === Number(simTarget.slice(2));

      if (match) scores[c.code] = simScore;
    }

    saveState(buildingType, scores);

    fetchEvaluate(buildingType, scores)
      .then((r) => {
        setCriteria(r.criteria as CriterionScore[]);
        setResults(r);
      })
      .catch((err) => {
        console.error("Simulation failed:", err?.response?.data || err);
      });
  }, [simTarget, simScore, buildingType, criteria]);

  const reloadFromStorage = useCallback(() => {
    const saved = loadState();
    if (!saved) return;

    setBuildingType(saved.buildingType);
    fetchEvaluate(saved.buildingType, saved.scores)
      .then((r) => {
        setCriteria(r.criteria as CriterionScore[]);
        setResults(r);
      })
      .catch((err) => {
        console.error("Reload failed:", err?.response?.data || err);
      });
  }, []);

  const nebBadgeColor =
    obs >= 85
      ? "from-teal-500 to-cyan-500"
      : obs >= 60
        ? "from-blue-500 to-indigo-500"
        : obs >= 40
          ? "from-amber-500 to-yellow-500"
          : "from-red-500 to-orange-500";

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-[#0b1120] text-white flex items-center justify-center"
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-4"
          />
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-sm"
          >
            Loading dashboard data…
          </motion.p>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-white">
      <Header />

      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <main
        id="main-content"
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24"
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-10"
        >
          <motion.div variants={staggerItem}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 ring-1 ring-teal-500/25 text-teal-400 text-xs font-semibold tracking-widest uppercase mb-4"
            >
              Executive Overview
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-4xl sm:text-5xl font-black tracking-tight"
            >
              Accessibility{" "}
              <span className="bg-gradient-to-r from-teal-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
                Dashboard
              </span>
            </motion.h1>

            <p className="text-slate-400 mt-2 text-base max-w-xl">
              Live analytical overview of building accessibility performance —
              synced in real time with the Certification Engine.
            </p>

            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                onClick={reloadFromStorage}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-sm font-medium transition-all"
                title="Reload latest scores from Certification Engine"
              >
                <RefreshIcon /> Sync
              </button>

              <Link
                href="/certification"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 font-semibold text-sm hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-teal-500/20"
              >
                Open Engine <ArrowRight />
              </Link>
            </div>

            <div className="mt-6 text-sm text-slate-400">
              Active Profile:{" "}
              <span className="text-white font-bold">
                {BUILDING_TYPE_LABELS[buildingType]}
              </span>
            </div>
          </motion.div>
        </motion.div>

        <ServerStatusWidget />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-6">
          <div className="md:col-span-1 bg-white/[0.03] rounded-3xl border border-white/8 p-8 text-center">
            <OBSGauge value={obs} />
            <div className="mt-4">
              <span
                className={`inline-block px-4 py-1.5 rounded-full bg-gradient-to-r ${nebBadgeColor} text-white text-sm font-bold`}
              >
                NEB Class {results.nebClass}
              </span>
              <p className="text-slate-400 text-xs mt-2">{results.nebMeaning}</p>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              {
                label: "OBS %",
                value: `${obs}%`,
                sub: "Overall Building Score",
                accent: "text-teal-400",
              },
              {
                label: "Access Level",
                value: results.nebEquivalent,
                sub: "EN 17210 Certification",
                accent: "text-blue-400",
              },
              {
                label: "Avg Score",
                value: `${results.averageRawScore}`,
                sub: "Mean criterion (1–5)",
                accent: "text-violet-400",
              },
              {
                label: "Total Criteria",
                value: `${criteria?.length || 0}`,
                sub: "Active evaluations",
                accent: "text-amber-400",
              },
            ].map(({ label, value, sub, accent }) => (
              <div
                key={label}
                className="bg-white/[0.03] rounded-2xl border border-white/8 p-5 flex flex-col justify-between"
              >
                <p className="text-slate-500 text-xs mb-2">{label}</p>
                <p className={`text-2xl sm:text-3xl font-black ${accent} tabular-nums`}>
                  {value}
                </p>
                <p className="text-slate-600 text-[10px] mt-1 leading-tight">{sub}</p>
              </div>
            ))}

            <div className="col-span-2 sm:col-span-4 bg-white/[0.03] rounded-2xl border border-white/8 p-5">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                Score Distribution
              </p>
              <div className="flex items-end gap-3 h-24">
                {[1, 2, 3, 4, 5].map((s) => {
                  const count = scoreDistribution[s] || 0;
                  const vals = Object.values(scoreDistribution) as number[];
                  const maxCount = Math.max(...vals);
                  const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  const colors = [
                    "bg-red-500",
                    "bg-orange-500",
                    "bg-amber-400",
                    "bg-blue-400",
                    "bg-teal-400",
                  ];

                  return (
                    <div key={s} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-white tabular-nums">
                        {count}
                      </span>
                      <div
                        className="w-full h-20 bg-slate-800 rounded-lg overflow-hidden"
                      >
                        <div
                          className={`w-full ${colors[s - 1]} rounded-lg transition-all duration-500`}
                          style={{
                            height: `${pct}%`,
                            marginTop: `${100 - pct}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">L{s}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/[0.03] rounded-3xl border border-white/8 p-6">
            <h3 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400" />
              TIS(i) — Disability Type Breakdown
            </h3>
            {[1, 2, 3, 4, 5].map((dt) => {
              const tis = (results.tisByDT as any)[dt] || 0;
              const avg = avgByDT[dt] || 0;
              const pctOfMax = Math.min(100, (tis / 25) * 100);

              return (
                <div key={dt} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${DT_GRADIENT[dt]} flex items-center justify-center text-white text-xs font-black`}
                      >
                        {dt}
                      </span>
                      <span className="text-slate-300 text-xs font-medium">
                        {dtLabels[dt]}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-teal-400 font-mono text-xs font-bold tabular-nums">
                        {tis.toFixed(3)}
                      </span>
                      <span className="text-slate-600 text-[10px] ml-2">avg {avg}/5</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${DT_GRADIENT[dt]} rounded-full transition-all duration-500`}
                      style={{ width: `${pctOfMax}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white/[0.03] rounded-3xl border border-white/8 p-6">
            <h3 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              CIS(j) — Assessment Dimension Breakdown
            </h3>
            {[1, 2, 3, 4, 5].map((ad) => {
              const cis = (results.cisByAD as any)[ad] || 0;
              const avg = avgByAD[ad] || 0;
              const pctOfMax = Math.min(100, (cis / 5) * 100);

              return (
                <div key={ad} className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-lg bg-gradient-to-br ${AD_GRADIENT[ad]} flex items-center justify-center text-white text-xs font-black`}
                      >
                        {ad}
                      </span>
                      <span className="text-slate-300 text-xs font-medium">
                        {adLabels[ad]}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-blue-400 font-mono text-xs font-bold tabular-nums">
                        {cis.toFixed(3)}
                      </span>
                      <span className="text-slate-600 text-[10px] ml-2">avg {avg}/5</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${AD_GRADIENT[ad]} rounded-full transition-all duration-500`}
                      style={{ width: `${pctOfMax}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/[0.03] rounded-3xl border border-white/8 p-6">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <span className="text-teal-400 text-lg">✓</span>
              Top Accessibility Strengths
            </h3>
            {!strengths || strengths.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">
                No criteria scored at Level 5 yet. Adjust scores in the Certification Engine.
              </p>
            ) : (
              <ul className="space-y-3">
                {strengths.map((c) => (
                  <li
                    key={c.code}
                    className="flex items-start gap-3 bg-teal-500/5 border border-teal-500/10 rounded-xl p-3.5"
                  >
                    <span className="font-mono text-[10px] text-teal-500 bg-teal-500/10 px-2 py-1 rounded-lg flex-shrink-0 mt-0.5">
                      {c.code}
                    </span>
                    <div>
                      <p className="text-sm text-white font-medium">{c.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        DT{c.disability} · AD{c.dimension} · W(ij)={c.value.toFixed(2)}
                      </p>
                    </div>
                    <span className="ml-auto flex-shrink-0 w-7 h-7 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-300 text-xs font-black">
                      5
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white/[0.03] rounded-3xl border border-white/8 p-6">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <span className="text-rose-400 text-lg">⚠</span>
              Priority Improvement Areas
            </h3>
            {!weaknesses || weaknesses.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">
                No criteria scored at Level 1 or 2. Excellent performance across all evaluations!
              </p>
            ) : (
              <ul className="space-y-3">
                {weaknesses.map((c) => (
                  <li
                    key={c.code}
                    className="flex items-start gap-3 bg-rose-500/5 border border-rose-500/10 rounded-xl p-3.5"
                  >
                    <span className="font-mono text-[10px] text-rose-500 bg-rose-500/10 px-2 py-1 rounded-lg flex-shrink-0 mt-0.5">
                      {c.code}
                    </span>
                    <div>
                      <p className="text-sm text-white font-medium">{c.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        DT{c.disability} · AD{c.dimension} · W(ij)={c.value.toFixed(2)}
                      </p>
                    </div>
                    <span className="ml-auto flex-shrink-0 w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-300 text-xs font-black">
                      {c.score}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white/[0.03] rounded-3xl border border-white/8 p-6 mb-8">
          <h3 className="text-sm font-bold text-slate-300 mb-5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-violet-400" />
            What-If Simulator
          </h3>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Target Group</label>
              <select
                value={simTarget}
                onChange={(e) => setSimTarget(e.target.value)}
                title="Target group for simulation"
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="all">All Criteria</option>
                {[1, 2, 3, 4, 5].map((dt) => (
                  <option key={`dt${dt}`} value={`dt${dt}`}>
                    DT {dt} – {dtLabels[dt]}
                  </option>
                ))}
                {[1, 2, 3, 4, 5].map((ad) => (
                  <option key={`ad${ad}`} value={`ad${ad}`}>
                    AD {ad} – {adLabels[ad]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-500 mb-1">Set Score To</label>
              <select
                value={simScore}
                onChange={(e) => setSimScore(Number(e.target.value))}
                title="Simulation score level"
                className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white"
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <option key={s} value={s}>
                    Level {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={applySimulation}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-semibold hover:brightness-110 transition-all"
            >
              Apply Simulation
            </button>
          </div>
        </div>

        <p className="text-center text-slate-600 text-xs mt-16">
          AASTool by Serg | Dev by Y
        </p>
      </main>

      <BottomNav />
    </div>
  );
}