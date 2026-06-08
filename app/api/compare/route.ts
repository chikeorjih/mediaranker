import { NextRequest, NextResponse } from "next/server";
import { getTwoForComparison, getMediaById, updateEloRatings } from "@/db";
import { calculateEloUpdate } from "@/lib/elo";

export const runtime = "nodejs";

// GET /api/compare?type=movie|tv
export async function GET(request: NextRequest) {
  const type = new URL(request.url).searchParams.get("type") ?? "movie";

  if (type !== "movie" && type !== "tv") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const pair = getTwoForComparison(type);

  if (!pair) {
    return NextResponse.json(
      {
        error: "not_enough_items",
        message: `Add at least 2 ${type === "movie" ? "movies" : "TV shows"} to start comparing.`,
      },
      { status: 400 }
    );
  }

  return NextResponse.json(pair);
}

// POST /api/compare  { winner_id, loser_id }
export async function POST(request: NextRequest) {
  let body: { winner_id?: unknown; loser_id?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const winnerId = Number(body.winner_id);
  const loserId = Number(body.loser_id);

  if (isNaN(winnerId) || isNaN(loserId) || winnerId === loserId) {
    return NextResponse.json(
      { error: "Valid winner_id and loser_id are required" },
      { status: 400 }
    );
  }

  const winner = getMediaById(winnerId);
  const loser = getMediaById(loserId);

  if (!winner || !loser) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const { newWinnerElo, newLoserElo } = calculateEloUpdate(winner, loser);
  updateEloRatings(winnerId, loserId, newWinnerElo, newLoserElo);

  return NextResponse.json({
    ok: true,
    winner: { id: winnerId, new_elo: Math.round(newWinnerElo) },
    loser: { id: loserId, new_elo: Math.round(newLoserElo) },
  });
}
