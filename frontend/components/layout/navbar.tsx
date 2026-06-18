"use client";

import React from "react";
import Link from "next/link";
import { useTheme } from "./mobile-nav";

export function Navbar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-slate-700 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-black">
            A
          </div>
          <span className="text-xl font-black text-white">Accessibility</span>
        </Link>

        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="glass px-4 py-2 rounded-xl text-teal-400 hover:bg-slate-800 transition-all font-semibold"
        >
          {theme === "light" ? "🌞 Light" : "🌙 Dark"}
        </button>
      </div>
    </nav>
  );
}