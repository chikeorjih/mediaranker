import { createClient, SupabaseClient } from "@supabase/supabase-js";

// ── Singleton ────────────────────────────────────────────────────────────────
// Survives Next.js hot-reload without creating multiple clients.

declare global {
  // eslint-disable-next-line no-var
  var _supabase: SupabaseClient | undefined;
}

function createSupabaseClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  return createClient(url, key, {
    auth: {
      // Server-side only — disable browser session persistence
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export const supabase: SupabaseClient =
  global._supabase ?? (global._supabase = createSupabaseClient());

// ── Types ────────────────────────────────────────────────────────────────────

export interface MediaItem {
  id: number;
  tmdb_id: number;
  type: "movie" | "tv";
  title: string;
  poster_path: string | null;
  overview: string | null;
  release_year: number | null;
  elo_rating: number;
  comparison_count: number;
  created_at: string;
}

export interface InsertMediaData {
  tmdb_id: number;
  type: "movie" | "tv";
  title: string;
  poster_path?: string | null;
  overview?: string | null;
  release_year?: number | null;
}

// ── Helper queries ───────────────────────────────────────────────────────────

export async function getMediaById(id: number): Promise<MediaItem | undefined> {
  const { data, error } = await supabase
    .from("media_items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    // PGRST116 = no rows found
    if (error.code === "PGRST116") return undefined;
    throw error;
  }
  return data as MediaItem;
}

export async function getAllByType(type: string): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from("media_items")
    .select("*")
    .eq("type", type)
    .order("elo_rating", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MediaItem[];
}

export async function insertMedia(data: InsertMediaData): Promise<MediaItem> {
  const { data: row, error } = await supabase
    .from("media_items")
    .insert({
      tmdb_id: data.tmdb_id,
      type: data.type,
      title: data.title,
      poster_path: data.poster_path ?? null,
      overview: data.overview ?? null,
      release_year: data.release_year ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return row as MediaItem;
}

export async function deleteMedia(id: number): Promise<void> {
  const { error } = await supabase
    .from("media_items")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function getRankings(type: string): Promise<MediaItem[]> {
  return getAllByType(type);
}

export async function updateEloRatings(
  winnerId: number,
  loserId: number,
  newWinnerElo: number,
  newLoserElo: number,
  winnerCurrentCount: number,
  loserCurrentCount: number
): Promise<void> {
  const [winnerResult, loserResult] = await Promise.all([
    supabase
      .from("media_items")
      .update({
        elo_rating: newWinnerElo,
        comparison_count: winnerCurrentCount + 1,
      })
      .eq("id", winnerId),
    supabase
      .from("media_items")
      .update({
        elo_rating: newLoserElo,
        comparison_count: loserCurrentCount + 1,
      })
      .eq("id", loserId),
  ]);

  if (winnerResult.error) throw winnerResult.error;
  if (loserResult.error) throw loserResult.error;

  const { error: compError } = await supabase
    .from("comparisons")
    .insert({ winner_id: winnerId, loser_id: loserId });

  if (compError) throw compError;
}

/**
 * Returns two distinct items for comparison, weighted toward items with
 * fewer comparisons so that new additions surface quickly.
 */
export async function getTwoForComparison(
  type: string
): Promise<[MediaItem, MediaItem] | null> {
  const items = await getAllByType(type);
  if (items.length < 2) return null;

  // Weight = 1 / (comparison_count + 1) — surfaces newer items more often
  const weights = items.map((item) => 1 / (item.comparison_count + 1));
  const total = weights.reduce((a, b) => a + b, 0);

  function pickWeighted(exclude?: number): number {
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      if (i === exclude) continue;
      r -= weights[i];
      if (r <= 0) return i;
    }
    return items.findIndex((_, i) => i !== exclude);
  }

  const idxA = pickWeighted();
  const idxB = pickWeighted(idxA);

  return [items[idxA], items[idxB]];
}
