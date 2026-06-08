import path from "path";
import { DatabaseSync } from "node:sqlite";

const DB_PATH = path.join(process.cwd(), "mediaranker.db");

// Singleton guard: survives Next.js hot-reload without leaking connections
declare global {
  // eslint-disable-next-line no-var
  var _db: DatabaseSync | undefined;
}

function openDb(): DatabaseSync {
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS media_items (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      tmdb_id          INTEGER NOT NULL,
      type             TEXT NOT NULL CHECK(type IN ('movie', 'tv')),
      title            TEXT NOT NULL,
      poster_path      TEXT,
      overview         TEXT,
      release_year     INTEGER,
      elo_rating       REAL NOT NULL DEFAULT 1000,
      comparison_count INTEGER NOT NULL DEFAULT 0,
      created_at       TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS uq_tmdb_type
      ON media_items(tmdb_id, type);

    CREATE TABLE IF NOT EXISTS comparisons (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      winner_id  INTEGER NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
      loser_id   INTEGER NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

export const db: DatabaseSync =
  global._db ?? (global._db = openDb());

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

// ── Serialization helper ─────────────────────────────────────────────────────
// node:sqlite returns rows with null prototypes, which Next.js cannot pass
// from Server Components to Client Components. Convert every row to a plain
// object so it is fully serializable.
function plain<T>(row: unknown): T {
  return JSON.parse(JSON.stringify(row)) as T;
}

// ── Helper queries ───────────────────────────────────────────────────────────

export function getMediaById(id: number): MediaItem | undefined {
  const stmt = db.prepare("SELECT * FROM media_items WHERE id = ?");
  const row = stmt.get(id);
  return row ? plain<MediaItem>(row) : undefined;
}

export function getAllByType(type: string): MediaItem[] {
  const stmt = db.prepare(
    "SELECT * FROM media_items WHERE type = ? ORDER BY elo_rating DESC"
  );
  return (stmt.all(type) as unknown[]).map((r) => plain<MediaItem>(r));
}

export function insertMedia(data: InsertMediaData): MediaItem {
  const stmt = db.prepare(`
    INSERT INTO media_items (tmdb_id, type, title, poster_path, overview, release_year)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(
    data.tmdb_id,
    data.type,
    data.title,
    data.poster_path ?? null,
    data.overview ?? null,
    data.release_year ?? null
  );
  return getMediaById(Number(result.lastInsertRowid))!;
}

export function deleteMedia(id: number): void {
  db.prepare("DELETE FROM media_items WHERE id = ?").run(id);
}

export function getRankings(type: string): MediaItem[] {
  return getAllByType(type);
}

export function updateEloRatings(
  winnerId: number,
  loserId: number,
  newWinnerElo: number,
  newLoserElo: number
): void {
  db.prepare(
    "UPDATE media_items SET elo_rating = ?, comparison_count = comparison_count + 1 WHERE id = ?"
  ).run(newWinnerElo, winnerId);
  db.prepare(
    "UPDATE media_items SET elo_rating = ?, comparison_count = comparison_count + 1 WHERE id = ?"
  ).run(newLoserElo, loserId);
  db.prepare(
    "INSERT INTO comparisons (winner_id, loser_id) VALUES (?, ?)"
  ).run(winnerId, loserId);
}

/**
 * Returns two distinct items for comparison, weighted toward items with
 * fewer comparisons so that new additions surface quickly.
 */
export function getTwoForComparison(
  type: string
): [MediaItem, MediaItem] | null {
  const items = getAllByType(type);
  if (items.length < 2) return null;

  // Build cumulative weight array — weight = 1 / (comparison_count + 1)
  const weights = items.map((item) => 1 / (item.comparison_count + 1));
  const total = weights.reduce((a, b) => a + b, 0);

  function pickWeighted(exclude?: number): number {
    let r = Math.random() * total;
    for (let i = 0; i < items.length; i++) {
      if (i === exclude) continue;
      r -= weights[i];
      if (r <= 0) return i;
    }
    // Fallback: return last non-excluded index
    return items.findIndex((_, i) => i !== exclude);
  }

  const idxA = pickWeighted();
  const idxB = pickWeighted(idxA);

  return [items[idxA], items[idxB]];
}
