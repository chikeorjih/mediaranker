import { redirect } from "next/navigation";
import Link from "next/link";
import { getRankings } from "@/db";
import RankingsList from "@/components/RankingsList";
import HubClient from "./HubClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { type: string };
}

export default function HubPage({ params }: PageProps) {
  const { type } = params;

  if (type !== "movie" && type !== "tv") {
    redirect("/");
  }

  const items = getRankings(type);
  const label = type === "movie" ? "Movies" : "TV Shows";
  const icon = type === "movie" ? "🎥" : "📺";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {icon} {label}
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {items.length} title{items.length !== 1 ? "s" : ""} in your collection
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Add button (needs modal state — delegated to HubClient) */}
          <HubClient type={type as "movie" | "tv"} />

          {/* Compare button */}
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
      </div>

      {items.length < 2 && items.length > 0 && (
        <p className="text-yellow-500 text-sm bg-yellow-900/20 border border-yellow-700/30 rounded-lg px-4 py-3">
          Add at least one more title to start comparing.
        </p>
      )}

      {/* Rankings */}
      <RankingsList initialItems={items} type={type as "movie" | "tv"} />
    </div>
  );
}
