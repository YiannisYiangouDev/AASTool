"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listenForConnectionStatus } from "@/lib/pwa";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    listenForConnectionStatus((online) => {
      setIsOnline(online);
      if (!online) {
        setShowIndicator(true);
      } else {
        setTimeout(() => setShowIndicator(false), 2000);
      }
    });
  }, []);

  return (
    <AnimatePresence>
      {!isOnline && showIndicator && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 backdrop-blur-sm px-4 py-3 text-center"
        >
          <p className="text-sm font-medium text-amber-950">
            You are offline - some features may be limited
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

