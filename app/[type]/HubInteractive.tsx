"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import SearchModal from "@/components/SearchModal";
import RankingsList from "@/components/RankingsList";
import type { MediaItem } from "@/db";

interface HubInteractiveProps {
  type: "movie" | "tv";
}

export default function HubInteractive({ type }: HubInteractiveProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const label = type === "movie" ? "Movies" : "TV Shows";

  const fetchRankings = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetch(`/api/rankings?type=${type}`);
      if (res.ok) setItems(await res.json());
    } finally {
      if (isInitial) setLoading(false); else setRefreshing(false);
    }
  }, [type]);

  // Always fetch fresh from Supabase on mount — no router cache involved
  useEffect(() => {
    fetchRankings(true);
  }, [fetchRankings]);

  const handleAdded = useCallback(() => {
    fetchRankings(false);
  }, [fetchRankings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      {/* Rankings list — fades slightly while refreshing after add/delete */}
      <div className={`transition-opacity duration-200 ${refreshing ? "opacity-50" : "opacity-100"}`}>
        <RankingsList items={items} type={type} onRefresh={() => fetchRankings(false)} />
      </div>

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
