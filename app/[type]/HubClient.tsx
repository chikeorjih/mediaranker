"use client";

import { useState } from "react";
import SearchModal from "@/components/SearchModal";

interface HubClientProps {
  type: "movie" | "tv";
}

export default function HubClient({ type }: HubClientProps) {
  const [showSearch, setShowSearch] = useState(false);

  const handleAdded = () => {
    // Refresh the page to pick up new rankings from the server component
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={() => setShowSearch(true)}
        className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
      >
        + Add {type === "movie" ? "Movies" : "TV Shows"}
      </button>

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
