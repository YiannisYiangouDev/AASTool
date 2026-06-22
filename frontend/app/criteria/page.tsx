"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { useCriteria } from "../../lib/hooks/useCriteria";
import { useMetadata } from "../../lib/hooks/useMetadata";
import { DT_TEXT_COLORS, AD_TEXT_COLORS } from "../../lib/theme";
import type { Criterion } from "../../types";

const SearchIcon = () => (
  <svg
    width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    className="text-slate-400"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CloseIcon = () => (
  <svg
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChevronDown = () => (
  <svg
    width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUp = () => (
  <svg
    width="18" height="18" viewBox="0 0 24 24"
    fill="none" stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export default function CriteriaPage() {
  const { dtLabels, adLabels } = useMetadata();
  const dtIds = Object.keys(dtLabels).map(Number).sort((a, b) => a - b);
  const adIds = Object.keys(adLabels).map(Number).sort((a, b) => a - b);
  const { data: criteria = [], isLoading, error } = useCriteria();
  const year = useMemo(() => new Date().getFullYear(), []);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDT, setSelectedDT] = useState<number | "all">("all");
  const [selectedAD, setSelectedAD] = useState<number | "all">("all");
  
  const [expandedCodes, setExpandedCodes] = useState<Record<string, boolean>>({});
const toggleExpand = (code: string) => {
    setExpandedCodes((prev) => ({
      ...prev,
      [code]: !prev[code],
    }));
  };

  const toggleExpandAll = (expand: boolean) => {
    if (!expand) {
      setExpandedCodes({});
    } else {
      const all: Record<string, boolean> = {};
      filteredCriteria.forEach((c) => {
        all[c.code] = true;
      });
      setExpandedCodes(all);
    }
  };

  const filteredCriteria = useMemo(() => {
    return criteria.filter((c) => {
      if (selectedDT !== "all" && c.disability !== selectedDT) return false;
      if (selectedAD !== "all" && c.dimension !== selectedAD) return false;
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const matchesCode = c.code.toLowerCase().includes(query);
      const matchesName = c.name.toLowerCase().includes(query);
      const matchesDefinition = c.definition.toLowerCase().includes(query);
      const matchesJustification = c.justification?.toLowerCase().includes(query);
      return matchesCode || matchesName || matchesDefinition || matchesJustification;
    });
  }, [criteria, searchQuery, selectedDT, selectedAD]);

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedDT("all");
    setSelectedAD("all");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0b1120] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-teal-400 border-t-transparent rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-slate-400 text-sm">Loading criteria…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0b1120] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-2">Failed to load criteria</p>
          <p className="text-slate-500 text-sm">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1120] text-white">
      {/* Global Navigation Header */}
      <Header />

      {/* Ambient background glows */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-teal-500/5 blur-[120px]" />
        <div className="absolute top-1/3 right-10 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute -bottom-40 left-1/3 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-[120px]" />
      </div>

      <main id="main-content" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-24">
        {/* Page Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-teal-500/10 ring-1 ring-teal-500/25 text-teal-400
                          text-xs font-semibold tracking-widest uppercase mb-5">
            Framework Criteria Reference
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
            Evaluation{" "}
            <span className="bg-gradient-to-r from-teal-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Criteria
            </span>
          </h1>
          <p className="text-slate-400 mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Explore all 63 criteria mapping accessibility requirements. Inspect definitions, 
            rationales, and progressive smart automation scales from Level 1 to Level 5.
          </p>
        </div>

        {/* Search and Filters Toolbar Container */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 mb-8 backdrop-blur-md shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Search Input */}
            <div className="lg:col-span-1">
              <label htmlFor="search" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                Search Criteria
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  id="search"
                  type="text"
                  placeholder="Search code, name, keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0f172a]/80 border border-slate-700 rounded-2xl pl-10 pr-10 py-3 text-white text-sm
                             placeholder-slate-500 outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/40
                             transition-all duration-150"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    aria-label="Clear search"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white transition-colors"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>
            </div>

            {/* Disability Type Filter */}
            <div>
              <label htmlFor="filter-dt" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                Disability Type (DT)
              </label>
              <select
                id="filter-dt"
                value={selectedDT}
                onChange={(e) => setSelectedDT(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="w-full bg-[#0f172a]/80 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm
                           outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/40 transition-all duration-150"
              >
                <option value="all">All Disabilities</option>
                {dtIds.map((dt) => (
                  <option key={dt} value={dt}>DT {dt} — {dtLabels[dt]}</option>
                ))}
              </select>
            </div>

            {/* Assessment Dimension Filter */}
            <div>
              <label htmlFor="filter-ad" className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2.5">
                Assessment Dimension (AD)
              </label>
              <select
                id="filter-ad"
                value={selectedAD}
                onChange={(e) => setSelectedAD(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="w-full bg-[#0f172a]/80 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm
                           outline-none focus:border-teal-500/80 focus:ring-1 focus:ring-teal-500/40 transition-all duration-150"
              >
                <option value="all">All Dimensions</option>
                {adIds.map((ad) => (
                  <option key={ad} value={ad}>AD {ad} — {adLabels[ad]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Toolbar Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-5 border-t border-white/5 text-xs">
            <div className="text-slate-400 tabular-nums">
              Showing <span className="text-white font-bold">{filteredCriteria.length}</span> of <span className="text-white font-bold">{criteria.length}</span> criteria
            </div>
            
            <div className="flex items-center gap-3">
              {(selectedDT !== "all" || selectedAD !== "all" || searchQuery !== "") && (
                <button
                  onClick={resetFilters}
                  className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-150"
                >
                  Reset Filters
                </button>
              )}
              <button
                onClick={() => toggleExpandAll(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all duration-150"
              >
                Expand All
              </button>
              <button
                onClick={() => toggleExpandAll(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all duration-150"
              >
                Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {filteredCriteria.length === 0 && (
          <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl backdrop-blur-sm">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-bold mb-2">No Criteria Found</h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              Your active search filters did not yield any matches. Try broadening your keywords or resetting filters.
            </p>
            <button
              onClick={resetFilters}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-blue-500 font-semibold text-sm hover:brightness-110 transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Criteria Grid */}
        <div className="space-y-4">
          {filteredCriteria.map((c) => {
            const isExpanded = !!expandedCodes[c.code];
            return (
              <article
                key={c.code}
                className={`group relative rounded-2xl border bg-white/[0.03] border-white/5
                            hover:bg-white/[0.05] hover:border-white/10 transition-all duration-200
                            ${isExpanded ? "ring-1 ring-teal-500/20 bg-white/[0.05] border-white/10" : ""}`}
              >
                {/* Horizontal left indicator colored by Disability Type */}
                <div
                  aria-hidden="true"
                  className={`absolute left-0 top-0 bottom-0 w-[4px] rounded-l-2xl bg-gradient-to-b ${
                    c.disability === 1 ? "from-teal-400 to-cyan-500" :
                    c.disability === 2 ? "from-blue-400 to-indigo-500" :
                    c.disability === 3 ? "from-violet-400 to-purple-500" :
                    c.disability === 4 ? "from-amber-400 to-orange-500" :
                    "from-rose-400 to-pink-500"
                  }`}
                />

                <div className="p-5 pl-7 sm:p-6 sm:pl-8">
                  {/* Card Header Summary */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      {/* Badge / Code Display */}
                      <span className={`inline-flex items-center justify-center font-mono text-xs font-black
                                      px-3 py-1.5 rounded-xl border border-white/10 bg-slate-900/80`}>
                        {c.code}
                      </span>
                      <div>
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${DT_TEXT_COLORS[c.disability]}`}>
                            DT {c.disability} · {dtLabels[c.disability]}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ${AD_TEXT_COLORS[c.dimension]}`}>
                            AD {c.dimension}
                          </span>
                        </div>
                        <h2 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                          {c.name}
                        </h2>
                      </div>
                    </div>

                    {/* Weight display & expand trigger */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 border-t border-white/5 sm:border-t-0 pt-3 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Base Cell Weight W(ij)</span>
                        <span className="text-sm font-mono text-teal-400 font-bold tabular-nums">{(c.value * 100).toFixed(0)}%</span>
                      </div>
                      <button
                        onClick={() => toggleExpand(c.code)}
                        aria-label={isExpanded ? `Collapse detail for ${c.code}` : `Expand detail for ${c.code}`}
                        aria-expanded={isExpanded ? "true" : "false"}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronUp /> : <ChevronDown />}
                      </button>
                    </div>
                  </div>

                  {/* Criteria description / always visible summary */}
                  <p className="text-slate-300 text-sm mt-4 leading-relaxed">
                    <span className="font-semibold text-slate-200">Definition: </span>
                    {c.definition}
                  </p>

                  {/* Expanded Content details */}
                  {isExpanded && (
                    <div className="mt-6 pt-5 border-t border-white/5 space-y-5 animate-fadeIn">
                      
                      {/* Justification / Rationale */}
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Justification / Rationale</h3>
                        <p className="text-slate-400 text-sm leading-relaxed bg-white/[0.015] border border-white/5 rounded-xl p-4">
                          {c.justification}
                        </p>
                      </div>

                      {/* Automation scale levels */}
                      <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Progressive Automation Levels</h3>
                        <ol className="grid grid-cols-1 xl:grid-cols-5 gap-3" aria-label="5 progressive levels of accessibility automation">
                          {c.levels.map((lvl, index) => {
                            const levelNum = index + 1;
                            return (
                              <li
                                key={levelNum}
                                className="flex flex-col rounded-xl border border-white/5 bg-slate-950/40 p-3.5 relative overflow-hidden"
                              >
                                <div className="absolute top-2 right-3 font-mono font-black text-2xl opacity-10 text-slate-400">
                                  L{levelNum}
                                </div>
                                <div className="text-xs font-bold text-teal-400 mb-1.5 flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-[10px] text-teal-300">
                                    {levelNum}
                                  </span>
                                  Level {levelNum}
                                </div>
                                <p className="text-slate-300 text-xs leading-relaxed flex-1">
                                  {lvl}
                                </p>
                              </li>
                            );
                          })}
                        </ol>
                      </div>

                      {/* Framework context tags */}
                      <div className="flex flex-wrap gap-x-6 gap-y-2 pt-1 text-xs text-slate-500 font-mono">
                        <div>
                          Disability Association: <span className="text-slate-400">DT {c.disability} ({dtLabels[c.disability]})</span>
                        </div>
                        <div className="hidden sm:block text-slate-700">•</div>
                        <div>
                          Evaluation Axis: <span className="text-slate-400">AD {c.dimension} ({adLabels[c.dimension]})</span>
                        </div>
                      </div>

                    </div>
                  )}

                </div>
              </article>
            );
          })}
        </div>

        {/* Framework Reference Summary card */}
        <div className="mt-12 bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-indigo-500/10 border border-slate-700/60 rounded-3xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">EN 17210 Certification Integration</h3>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                Every criterion is weighted dynamically based on the building categories (e.g. Residential, Commercial). 
                Adjusting the rating levels (1–5) inside the Certification Engine calculates specific Total Impairment (TIS) 
                and Component Influence (CIS) coefficients.
              </p>
            </div>
            <button
              onClick={() => window.location.href = "/certification"}
              className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 rounded-2xl
                         bg-gradient-to-r from-teal-500 to-blue-500 font-semibold text-sm text-white
                         hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Run Certification Engine →
            </button>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-slate-600 text-xs mt-16">
          AASTool by Serg | Dev by Y
        </p>
      </main>

      {/* Responsive mobile Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
