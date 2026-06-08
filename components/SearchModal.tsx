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

type AddState = "idle" | "adding" | "added" | "duplicate" | "error";

export default function SearchModal({ type, onClose, onAdded }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TmdbSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // Per-item add state
  const [addStates, setAddStates] = useState<Map<number, AddState>>(new Map());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const setItemState = (id: number, state: AddState) =>
    setAddStates((prev) => new Map(prev).set(id, state));

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`);
      if (!res.ok) throw new Error("Search failed");
      setResults(await res.json());
    } catch {
      setSearchError("Search failed. Is your TMDB API key set?");
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
    const current = addStates.get(result.id) ?? "idle";
    if (current !== "idle" && current !== "error") return; // already handled

    // Immediately show loading state — gives instant feedback
    setItemState(result.id, "adding");

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
        setItemState(result.id, "duplicate");
        return;
      }
      if (!res.ok) throw new Error("Add failed");

      setItemState(result.id, "added");
      onAdded(); // triggers rankings refresh in parent — no page reload
    } catch {
      setItemState(result.id, "error");
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
          {searchError && (
            <p className="text-red-400 text-sm text-center py-4">{searchError}</p>
          )}
          {loading && (
            <p className="text-gray-400 text-sm text-center py-4">Searching…</p>
          )}
          {!loading && results.length === 0 && query.trim() && !searchError && (
            <p className="text-gray-500 text-sm text-center py-4">No results found.</p>
          )}

          {results.map((result) => {
            const imgSrc = posterUrl(result.poster_path, "w185");
            const addState = addStates.get(result.id) ?? "idle";

            return (
              <div
                key={result.id}
                className="flex items-center gap-3 bg-gray-800 rounded-lg p-2"
              >
                {/* Thumbnail */}
                {imgSrc ? (
                  <div className="relative flex-shrink-0 w-10 h-14 rounded overflow-hidden">
                    <Image src={imgSrc} alt={result.title} fill className="object-cover" sizes="40px" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-10 h-14 bg-gray-700 rounded" />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{result.title}</p>
                  {result.release_year && (
                    <p className="text-gray-400 text-xs">{result.release_year}</p>
                  )}
                </div>

                {/* Add button — state-driven */}
                <AddButton state={addState} onClick={() => handleAdd(result)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddButton({ state, onClick }: { state: AddState; onClick: () => void }) {
  const base = "flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-full transition-all min-w-[80px] text-center";

  if (state === "adding") {
    return (
      <button disabled className={`${base} bg-indigo-700 text-indigo-200 cursor-default`}>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
          Adding…
        </span>
      </button>
    );
  }
  if (state === "added") {
    return (
      <button disabled className={`${base} bg-green-700 text-white cursor-default`}>
        Added ✓
      </button>
    );
  }
  if (state === "duplicate") {
    return (
      <button disabled className={`${base} bg-gray-600 text-gray-400 cursor-default`}>
        Already added
      </button>
    );
  }
  if (state === "error") {
    return (
      <button onClick={onClick} className={`${base} bg-red-700 hover:bg-red-600 text-white`}>
        Retry
      </button>
    );
  }
  // idle
  return (
    <button onClick={onClick} className={`${base} bg-indigo-600 hover:bg-indigo-500 text-white`}>
      Add
    </button>
  );
}
