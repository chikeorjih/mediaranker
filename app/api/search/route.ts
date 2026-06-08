import { NextRequest, NextResponse } from "next/server";
import { searchTMDB } from "@/lib/tmdb";
import type { MediaType } from "@/lib/tmdb";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const type = (searchParams.get("type") ?? "movie") as MediaType;

  if (!q.trim()) {
    return NextResponse.json([]);
  }

  if (type !== "movie" && type !== "tv") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    const results = await searchTMDB(q, type);
    return NextResponse.json(results);
  } catch (err) {
    console.error("TMDB search error:", err);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
