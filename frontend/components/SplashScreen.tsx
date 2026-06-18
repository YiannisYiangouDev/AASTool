"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade after 1.8s, fully remove after animation completes
    const fadeTimer = setTimeout(() => setFadeOut(true), 1800);
    const removeTimer = setTimeout(() => setVisible(false), 2300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0b1120] transition-opacity duration-500 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 blur-[100px] animate-pulse" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* SERG wordmark */}
        <div className="flex items-baseline gap-1">
          <span className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 bg-clip-text text-transparent">
            SERG
          </span>
        </div>

        {/* Animated underline bar */}
        <div className="relative w-32 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 rounded-full animate-slide" />
        </div>

        {/* Powered by line */}
        <p className="text-slate-500 text-sm tracking-widest uppercase font-medium animate-pulse">
          Proudly Developed by Serg Team
        </p>
      </div>
    </div>
  );
}
