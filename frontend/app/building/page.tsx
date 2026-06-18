"use client";

import Link from "next/link";
import Header from "../../components/Header";
import BottomNav from "../../components/BottomNav";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "../../lib/api/endpoints";

type AssessmentDimension = {
  id: number;
  name: string;
  description: string;
};

const ACCENT_COLORS = [
  { from: "from-teal-500", to: "to-emerald-500", glow: "bg-teal-500/20", ring: "ring-teal-500/30", icon: "🏗️", label: "Spatial & Physical" },
  { from: "from-blue-500", to: "to-cyan-500", glow: "bg-blue-500/20", ring: "ring-blue-500/30", icon: "🛡️", label: "Safety & Comfort" },
  { from: "from-violet-500", to: "to-purple-500", glow: "bg-violet-500/20", ring: "ring-violet-500/30", icon: "🧠", label: "Cognitive & Navigation" },
  { from: "from-amber-500", to: "to-orange-500", glow: "bg-amber-500/20", ring: "ring-amber-500/30", icon: "💻", label: "Digital & Smart" },
  { from: "from-rose-500", to: "to-pink-500", glow: "bg-rose-500/20", ring: "ring-rose-500/30", icon: "🤝", label: "Social & Human" },
];

function SkeletonCard() {
  return (
    <div className="relative p-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-24 bg-white/10 rounded-lg" />
          <div className="h-6 w-3/4 bg-white/10 rounded-lg" />
          <div className="h-4 w-full bg-white/10 rounded-lg" />
          <div className="h-4 w-2/3 bg-white/10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function BuildingPage() {
  const { data: dimensions = [], isLoading, error } = useQuery({
    queryKey: ['assessment-dimensions'],
    queryFn: () => endpoints.getAssessmentDimensions(),
  });

  return (
    <div className="min-h-screen bg-[#030712] text-white selection:bg-teal-500/30">
      <Header />

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-teal-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/[0.03] rounded-full blur-[150px]" />
      </div>

      <main id="main-content" className="relative z-10 px-4 sm:px-6 lg:px-8 py-16 max-w-7xl mx-auto pt-28 pb-28">
        {/* Hero */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 text-xs font-medium tracking-widest uppercase mb-6">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            Assessment Framework
          </div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
            Building <span className="bg-gradient-to-r from-teal-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">Dimensions</span>
          </h1>
          <p className="text-slate-400 mt-5 text-lg max-w-2xl mx-auto leading-relaxed">
            Five interconnected pillars that form the foundation of inclusive building assessment. Each dimension evaluates a critical facet of accessibility.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-8 h-[1px] bg-teal-500/40" />
              {dimensions.length} dimensions
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-8 h-[1px] bg-blue-500/40" />
              Multi-criteria scoring
            </span>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 ring-1 ring-red-500/20 mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Failed to load dimensions</h2>
            <p className="text-slate-400">Please check your connection and try again</p>
          </div>
        )}

        {/* Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {dimensions.map((dimension: AssessmentDimension, idx: number) => {
              const color = ACCENT_COLORS[idx % ACCENT_COLORS.length];
              return (
                <div
                  key={dimension.id}
                  className={`group relative p-6 sm:p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] transition-all duration-500 hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-2xl hover:shadow-${color.from.replace('from-','')}/5`}
                >
                  {/* Number ribbon */}
                  <div className="absolute top-0 right-6 -translate-y-1/2">
                    <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${color.from} ${color.to} text-white text-sm font-black shadow-lg ring-4 ring-[#030712]`}>
                      {dimension.id}
                    </span>
                  </div>

                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl ${color.glow} ring-1 ${color.ring} mb-5`}>
                    <span className="text-2xl">{color.icon}</span>
                  </div>

                  {/* Label */}
                  <span className={`inline-block text-xs font-semibold tracking-widest uppercase bg-gradient-to-r ${color.from} ${color.to} bg-clip-text text-transparent mb-2`}>
                    {color.label}
                  </span>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-3 leading-snug group-hover:text-teal-100 transition-colors">
                    {dimension.name}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                    {dimension.description}
                  </p>

                  {/* Bottom accent */}
                  <div className={`mt-6 h-1 rounded-full bg-gradient-to-r ${color.from} ${color.to} opacity-0 group-hover:opacity-100 transition-opacity duration-500 w-0 group-hover:w-full`} />
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        {!isLoading && !error && (
          <div className="mt-20 text-center">
            <div className="inline-flex flex-col items-center gap-4 p-8 sm:p-12 rounded-3xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm max-w-2xl w-full">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-500/20 to-blue-500/20 ring-1 ring-teal-500/30">
                <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Ready to evaluate?</h2>
              <p className="text-slate-400 text-sm max-w-md">
                Score each criterion across all five dimensions and generate a comprehensive accessibility certification.
              </p>
              <Link
                href="/certification"
                className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold text-sm hover:from-teal-400 hover:to-blue-400 hover:shadow-lg hover:shadow-teal-500/25 transition-all duration-300 hover:scale-[1.03] active:scale-95"
              >
                Start Certification
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}