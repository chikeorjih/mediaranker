import Image from "next/image";
import { posterUrl } from "@/lib/tmdb";
import type { MediaItem } from "@/db";

interface MediaCardProps {
  item: MediaItem;
  rank?: number;
  showElo?: boolean;
  onClick?: () => void;
  /** If true, renders a large comparison-style card */
  large?: boolean;
}

export default function MediaCard({
  item,
  rank,
  showElo,
  onClick,
  large,
}: MediaCardProps) {
  const imgSrc = posterUrl(item.poster_path, large ? "w500" : "w342");
  const isClickable = !!onClick;

  const imgWidth = large ? 300 : 120;
  const imgHeight = large ? 450 : 180;

  return (
    <div
      className={`
        group relative bg-gray-800 rounded-xl overflow-hidden shadow-lg
        transition-all duration-200
        ${isClickable ? "cursor-pointer hover:scale-105 hover:shadow-2xl hover:ring-4 hover:ring-indigo-500" : ""}
        ${large ? "w-72" : "flex items-center gap-3 p-2"}
      `}
      onClick={onClick}
    >
      {/* Rank badge */}
      {rank !== undefined && (
        <div className="absolute top-2 left-2 z-10 bg-indigo-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
          {rank}
        </div>
      )}

      {/* Poster */}
      {imgSrc ? (
        <div className={`relative flex-shrink-0 ${large ? "w-full" : ""}`} style={{ width: imgWidth, height: imgHeight }}>
          <Image
            src={imgSrc}
            alt={`${item.title} poster`}
            fill
            className="object-cover"
            sizes={large ? "300px" : "120px"}
          />
        </div>
      ) : (
        <div
          className={`flex-shrink-0 bg-gray-700 flex items-center justify-center text-gray-500 text-xs`}
          style={{ width: imgWidth, height: imgHeight }}
        >
          No poster
        </div>
      )}

      {/* Info */}
      <div className={`${large ? "p-3" : "flex-1 min-w-0"}`}>
        <p className={`font-semibold text-white leading-snug ${large ? "text-base" : "text-sm truncate"}`}>
          {item.title}
        </p>
        {item.release_year && (
          <p className="text-gray-400 text-xs mt-0.5">{item.release_year}</p>
        )}
        {showElo && (
          <p className="text-indigo-400 text-xs mt-1 font-medium">
            {Math.round(item.elo_rating)} pts
            <span className="text-gray-500 ml-1">
              ({item.comparison_count} match{item.comparison_count !== 1 ? "es" : ""})
            </span>
          </p>
        )}
      </div>

      {/* Hover overlay for large cards */}
      {large && isClickable && (
        <div className="absolute inset-0 bg-indigo-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-indigo-700 font-bold px-4 py-2 rounded-full text-sm shadow-lg">
            Pick this
          </span>
        </div>
      )}
    </div>
  );
}
