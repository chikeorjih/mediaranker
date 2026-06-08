import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-3">
          🎬 MediaRanker
        </h1>
        <p className="text-gray-400 text-lg">
          Build your personal rankings through head-to-head comparisons
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
        <Link href="/movie">
          <div className="group bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-500 rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer hover:shadow-xl hover:shadow-indigo-900/30">
            <div className="text-5xl mb-4">🎥</div>
            <h2 className="text-xl font-bold text-white mb-1">Movies</h2>
            <p className="text-gray-400 text-sm">
              Rank your movie collection
            </p>
          </div>
        </Link>

        <Link href="/tv">
          <div className="group bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-indigo-500 rounded-2xl p-8 text-center transition-all duration-200 cursor-pointer hover:shadow-xl hover:shadow-indigo-900/30">
            <div className="text-5xl mb-4">📺</div>
            <h2 className="text-xl font-bold text-white mb-1">TV Shows</h2>
            <p className="text-gray-400 text-sm">
              Rank your TV show collection
            </p>
          </div>
        </Link>
      </div>

      <p className="text-gray-600 text-sm text-center max-w-sm">
        Add titles from TMDB, then pick the better one in head-to-head matchups.
        The Elo system builds your ranking automatically.
      </p>
    </div>
  );
}
