"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import SearchModal from "@/components/SearchModal";
import RankingsList from "@/components/RankingsList";
import type { MediaItem } from "@/db";

interface HubInteractiveProps {
  type: "movie" | "tv";
  initialItems: MediaItem[];
}

export default function HubInteractive({ type, initialItems }: HubInteractiveProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [refreshing, setRefreshing] = useState(false);

  const label = type === "movie" ? "Movies" : "TV Shows";

  // Sync local state whenever the server re-renders with fresher data
  // (e.g. after returning from the compare page)
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const refreshRankings = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/rankings?type=${type}`);
      if (res.ok) setItems(await res.json());
    } finally {
      setRefreshing(false);
    }
  }, [type]);

  // Called by SearchModal each time an item is successfully added
  const handleAdded = useCallback(() => {
    refreshRankings();
    // Modal stays open — user can keep adding more items
  }, [refreshRankings]);

  return (
    <>
      {/* Controls row */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowSearch(true)}
          className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
        >
          + Add {label}
        </button>

        <Link
          href={`/compare/${type}`}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm transition-colors
            ${items.length >= 2
              ? "bg-indigo-600 hover:bg-indigo-500 text-white"
              : "bg-gray-700 text-gray-500 cursor-not-allowed pointer-events-none"
            }
          `}
        >
          ⚔️ Start Comparing
        </Link>
      </div>

      {/* Item count */}
      <p className="text-gray-400 text-sm -mt-4">
        {items.length} title{items.length !== 1 ? "s" : ""} in your collection
      </p>

      {/* Not-enough-items nudge */}
      {items.length === 1 && (
        <p className="text-yellow-500 text-sm bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-4 py-3">
          Add at least one more title to start comparing.
        </p>
      )}

      {/* Rankings list — fades slightly while refreshing */}
      <div className={`transition-opacity duration-200 ${refreshing ? "opacity-50" : "opacity-100"}`}>
        <RankingsList items={items} type={type} onRefresh={refreshRankings} />
      </div>

      {/* Search / add modal */}
      {showSearch && (
        <SearchModal
          type={type}
          onClose={() => setShowSearch(false)}
          onAdded={handleAdded}
        />
      )}
    </>
  );
}
