"use client";

import { useEffect, useState } from "react";
import { endpoints } from "../api/endpoints";

interface DtAdItem {
  id: number;
  name: string;
  description: string;
}

export function useMetadata() {
  const [dtLabels, setDtLabels] = useState<Record<number, string>>({});
  const [adLabels, setAdLabels] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [dt, ad] = await Promise.all([
          endpoints.getDisabilityTypes(),
          endpoints.getAssessmentDimensions(),
        ]);
        if (cancelled) return;
        const dtMap: Record<number, string> = {};
        for (const item of dt as DtAdItem[]) {
          dtMap[item.id] = item.name;
        }
        const adMap: Record<number, string> = {};
        for (const item of ad as DtAdItem[]) {
          adMap[item.id] = item.name;
        }
        setDtLabels(dtMap);
        setAdLabels(adMap);
      } catch (err) {
        console.error("Failed to load metadata:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { dtLabels, adLabels, loading };
}
