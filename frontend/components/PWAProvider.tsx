"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  registerServiceWorker,
  listenForPWAInstallPrompt,
  requestInstallPrompt,
} from "@/lib/pwa";

interface PWAInstallPrompt extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAProvider() {
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPrompt | null>(
    null
  );
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    registerServiceWorker().catch(console.error);

    listenForPWAInstallPrompt((prompt) => {
      console.log("PWA install prompt available");
      setDeferredPrompt(prompt);
      setShowInstallPrompt(true);
    });
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    const accepted = await requestInstallPrompt(deferredPrompt);

    if (accepted) {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    }

    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  return (
    <AnimatePresence>
      {showInstallPrompt && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 right-4 z-40 md:left-auto md:w-96 rounded-lg border border-blue-500/20 bg-gradient-to-r from-blue-500/5 to-purple-500/5 backdrop-blur-md p-4 shadow-xl"
        >
          <h3 className="font-semibold text-white mb-2">
            Install AASTool
          </h3>
          <p className="text-sm text-slate-300 mb-4">
            Install this app on your device for quick access and offline use.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {isInstalling ? "Installing..." : "Install"}
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2 rounded-lg border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              Not now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
