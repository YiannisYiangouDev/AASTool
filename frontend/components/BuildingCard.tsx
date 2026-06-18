"use client";
import React from "react";
import Link from "next/link";

export default function BuildingCard({ building }: { building: any }) {
  return (
    <article className="p-4 border rounded">
      <h3 className="font-semibold"><Link href={`/buildings/${building.id}`}>{building.name}</Link></h3>
      <p className="text-sm text-slate-500">Type: {building.type}</p>
    </article>
  );
}
