"use client";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { endpoints } from "../../../lib/api/endpoints";

interface BuildingDetailProps {
  params: Promise<{ id: string }>;
}

export default function BuildingDetail({ params }: BuildingDetailProps) {
  const { id } = React.use(params);
  const { data, isLoading, error } = useQuery({
    queryKey: ["building", id],
    queryFn: () => endpoints.getBuilding(id),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading building</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">{data.name}</h1>
      <p className="text-slate-600">Type: {data.type}</p>
      <div className="mt-6">
        <h2 className="font-semibold">Assessments</h2>
        <ul>
          {data.assessments?.map((a: any) => (
            <li key={a.id}>{a.id} — {a.status}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
