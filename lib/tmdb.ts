const TMDB_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export type MediaType = "movie" | "tv";

export interface TmdbSearchResult {
  id: number;
  title: string;        // normalized (from name for TV)
  poster_path: string | null;
  overview: string;
  release_year: number | null;
  media_type: MediaType;
}

interface TmdbMovieRaw {
  id: number;
  title: string;
  poster_path: string | null;
  overview: string;
  release_date: string;
}

interface TmdbTvRaw {
  id: number;
  name: string;
  poster_path: string | null;
  overview: string;
  first_air_date: string;
}

function parseYear(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const year = parseInt(dateStr.slice(0, 4), 10);
  return isNaN(year) ? null : year;
}

export async function searchTMDB(
  query: string,
  type: MediaType
): Promise<TmdbSearchResult[]> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");

  const url = `${TMDB_BASE}/search/${type}?api_key=${key}&query=${encodeURIComponent(
    query
  )}&page=1&include_adult=false`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);

  const data = await res.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.results.map((raw: any): TmdbSearchResult => {
    if (type === "movie") {
      const r = raw as TmdbMovieRaw;
      return {
        id: r.id,
        title: r.title,
        poster_path: r.poster_path,
        overview: r.overview,
        release_year: parseYear(r.release_date),
        media_type: "movie",
      };
    } else {
      const r = raw as TmdbTvRaw;
      return {
        id: r.id,
        title: r.name,
        poster_path: r.poster_path,
        overview: r.overview,
        release_year: parseYear(r.first_air_date),
        media_type: "tv",
      };
    }
  });
}

/** Build a full TMDB poster URL from a stored poster_path */
export function posterUrl(
  posterPath: string | null,
  size: "w185" | "w342" | "w500" = "w342"
): string | null {
  if (!posterPath) return null;
  return `${TMDB_IMAGE_BASE}/${size}${posterPath}`;
}
