"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import type { TmdbSearchResult } from "@/lib/tmdb";
import { posterUrl } from "@/lib/tmdb";

interface SearchModalProps {
  type: "movie" | "tv";
  onClose: () => void;
  onAdded: () => void;
}

export default function SearchModal({ type, onClose, onAdded }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
  const [duplicateIds, setDuplicateIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Dismiss on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`);
      if (!res.ok) throw new Error("Search failed");
      setResults(await res.json());
    } catch {
      setError("Search failed. Is your TMDB API key set?");
    } finally {
      setLoading(false);
    }
  }, [type]);

  const handleInput = (q: string) => {
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  };

  const handleAdd = async (result: TmdbSearchResult) => {
    try {
      const res = await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdb_id: result.id,
          type,
          title: result.title,
          poster_path: result.poster_path,
          overview: result.overview,
          release_year: result.release_year,
        }),
      });

      if (res.status === 409) {
        setDuplicateIds((prev) => new Set(Array.from(prev).concat(result.id)));
        return;
      }
      if (!res.ok) throw new Error("Add failed");

      setAddedIds((prev) => new Set(Array.from(prev).concat(result.id)));
      onAdded();
    } catch {
      alert("Failed to add item. Please try again.");
    }
  };

  const label = type === "movie" ? "movies" : "TV shows";

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-70 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700">
          <h2 className="text-white font-bold text-lg">Add {label}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Search input */}
        <div className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder={`Search for ${label}…`}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500"
          />
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-2">
          {error && (
            <p className="text-red-400 text-sm text-center py-4">{error}</p>
          )}
          {loading && (
            <p className="text-gray-400 text-sm text-center py-4">Searching…</p>
          )}
          {!loading && results.length === 0 && query.trim() && !error && (
            <p className="text-gray-500 text-sm text-center py-4">No results found.</p>
          )}
          {results.map((result) => {
            const imgSrc = posterUrl(result.poster_path, "w185");
            const isAdded = addedIds.has(result.id);
            const isDuplicate = duplicateIds.has(result.id);

            return (
              <div
                key={result.id}
                className="flex items-center gap-3 bg-gray-800 rounded-lg p-2"
              >
                {/* Thumbnail */}
                {imgSrc ? (
                  <div className="relative flex-shrink-0 w-10 h-14 rounded overflow-hidden">
                    <Image
                      src={imgSrc}
                      alt={result.title}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-10 h-14 bg-gray-700 rounded" />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {result.title}
                  </p>
                  {result.release_year && (
                    <p className="text-gray-400 text-xs">{result.release_year}</p>
                  )}
                </div>

                {/* Add button */}
                <button
                  onClick={() => handleAdd(result)}
                  disabled={isAdded || isDuplicate}
                  className={`
                    flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-colors
                    ${isAdded
                      ? "bg-green-700 text-white cursor-default"
                      : isDuplicate
                      ? "bg-gray-600 text-gray-400 cursor-default"
                      : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }
                  `}
                >
                  {isAdded ? "Added ✓" : isDuplicate ? "Already added" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
