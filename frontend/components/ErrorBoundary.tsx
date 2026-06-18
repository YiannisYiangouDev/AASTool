"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex min-h-screen items-center justify-center bg-slate-950 p-4"
        >
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-8 backdrop-blur-sm">
            <h1 className="mb-4 text-2xl font-bold text-red-500">
              Something went wrong
            </h1>
            <p className="mb-6 text-slate-400">
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/";
              }}
              className="rounded-lg bg-red-500/10 px-4 py-2 text-red-500 hover:bg-red-500/20 transition-colors"
            >
              Return Home
            </button>
          </div>
        </motion.div>
      );
    }

    return this.props.children;
  }
}

