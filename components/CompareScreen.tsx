"use client";

import { useState, useEffect, useCallback } from "react";
import type { MediaItem } from "@/db";
import MediaCard from "./MediaCard";
import Link from "next/link";

interface CompareScreenProps {
  type: "movie" | "tv";
}

export default function CompareScreen({ type }: CompareScreenProps) {
  const [pair, setPair] = useState<[MediaItem, MediaItem] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [streak, setStreak] = useState(0);
  const label = type === "movie" ? "movies" : "TV shows";

  const fetchPair = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/compare?type=${type}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Failed to load pair");
        setPair(null);
        return;
      }
      setPair(await res.json());
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetchPair();
  }, [fetchPair]);

  // Keyboard support: ← = left, → = right
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!pair || submitting) return;
      if (e.key === "ArrowLeft") pick(pair[0], pair[1]);
      if (e.key === "ArrowRight") pick(pair[1], pair[0]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair, submitting]);

  const pick = async (winner: MediaItem, loser: MediaItem) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner_id: winner.id, loser_id: loser.id }),
      });
      setStreak((s) => s + 1);
      await fetchPair();
    } catch {
      setError("Failed to submit. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <p className="text-gray-300 text-lg max-w-sm">{error}</p>
        <div className="flex gap-3">
          <Link
            href={`/${type}`}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Back to {label}
          </Link>
        </div>
      </div>
    );
  }

  if (!pair) return null;

  return (
    <div className="flex flex-col items-center gap-8 py-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Which is better?</h1>
        <p className="text-gray-400 text-sm mt-1">
          Click a poster or use ← → arrow keys to pick
          {streak > 0 && (
            <span className="ml-2 text-indigo-400 font-medium">{streak} compared so far</span>
          )}
        </p>
      </div>

      {/* VS layout */}
      <div className={`flex items-center gap-6 md:gap-12 ${submitting ? "opacity-50 pointer-events-none" : ""}`}>
        <MediaCard
          item={pair[0]}
          large
          onClick={() => pick(pair[0], pair[1])}
        />

        <div className="flex flex-col items-center gap-2">
          <span className="text-gray-500 font-bold text-3xl">VS</span>
        </div>

        <MediaCard
          item={pair[1]}
          large
          onClick={() => pick(pair[1], pair[0])}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={fetchPair}
          disabled={submitting}
          className="text-gray-400 hover:text-white text-sm underline transition-colors"
        >
          Skip this pair
        </button>
        <Link
          href={`/${type}`}
          className="text-gray-400 hover:text-white text-sm underline transition-colors"
        >
          View rankings
        </Link>
      </div>
    </div>
  );
}
