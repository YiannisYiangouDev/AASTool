"use client";
import React from "react";
import { useBuildings } from "../../lib/hooks/useBuildings";
import BuildingCard from "../../components/BuildingCard";

export default function BuildingsPage() {
  const { data, isLoading, error } = useBuildings();

  if (isLoading) return <div>Loading buildings...</div>;
  if (error) return <div>Error loading buildings</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Buildings</h1>
      <div className="grid gap-4">
        {data?.map((b) => (
          <BuildingCard key={b.id} building={b} />
        ))}
      </div>
    </div>
  );
}
