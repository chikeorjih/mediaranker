import { NextRequest, NextResponse } from "next/server";
import { insertMedia } from "@/db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: {
    tmdb_id?: unknown;
    type?: unknown;
    title?: unknown;
    poster_path?: unknown;
    overview?: unknown;
    release_year?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tmdb_id, type, title, poster_path, overview, release_year } = body;

  if (!tmdb_id || !type || !title) {
    return NextResponse.json(
      { error: "tmdb_id, type, and title are required" },
      { status: 400 }
    );
  }

  if (type !== "movie" && type !== "tv") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    const item = insertMedia({
      tmdb_id: Number(tmdb_id),
      type: type as "movie" | "tv",
      title: String(title),
      poster_path: poster_path ? String(poster_path) : null,
      overview: overview ? String(overview) : null,
      release_year: release_year ? Number(release_year) : null,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (err: unknown) {
    // SQLite unique constraint violation
    if (
      err instanceof Error &&
      err.message.includes("UNIQUE constraint failed")
    ) {
      return NextResponse.json(
        { error: "Already in your collection" },
        { status: 409 }
      );
    }
    console.error("Insert error:", err);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
