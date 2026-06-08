"use client";

import { useState } from "react";
import type { MediaItem } from "@/db";
import MediaCard from "./MediaCard";

interface RankingsListProps {
  initialItems: MediaItem[];
  type: "movie" | "tv";
}

export default function RankingsList({ initialItems, type }: RankingsListProps) {
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [removing, setRemoving] = useState<number | null>(null);

  const refresh = async () => {
    const res = await fetch(`/api/rankings?type=${type}`);
    if (res.ok) setItems(await res.json());
  };

  const handleRemove = async (id: number) => {
    if (!confirm("Remove from your collection?")) return;
    setRemoving(id);
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    await refresh();
    setRemoving(null);
  };

  if (items.length === 0) {
    return (
      <p className="text-gray-400 text-center py-10">
        Your collection is empty. Search and add some {type === "movie" ? "movies" : "TV shows"} to get started!
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={item.id} className="relative group">
          <MediaCard item={item} rank={index + 1} showElo />
          <button
            onClick={() => handleRemove(item.id)}
            disabled={removing === item.id}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow"
            title="Remove"
          >
            {removing === item.id ? "…" : "×"}
          </button>
        </div>
      ))}
    </div>
  );
}
