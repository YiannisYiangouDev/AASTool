"use client";
import React from "react";
import { useAssessment } from "../../../lib/hooks/useAssessment";

interface AssessmentPageProps {
  params: Promise<{ id: string }>;
}

export default function AssessmentPage({ params }: AssessmentPageProps) {
  const { id } = React.use(params);
  const { data, isLoading, error } = useAssessment(id);

  if (isLoading) return <div className="p-6 text-white">Loading assessment...</div>;
  if (error || !data) return <div className="p-6 text-red-400">Error loading assessment</div>;

  return (
    <div className="min-h-screen bg-[#0b1120] p-6 text-white">
      <h1 className="text-2xl font-bold mb-4">Assessment Results</h1>
      <pre className="bg-slate-800 p-4 rounded-lg overflow-auto">{JSON.stringify(data.results, null, 2)}</pre>
    </div>
  );
}
