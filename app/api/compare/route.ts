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

  try {
    const pair = await getTwoForComparison(type);

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
  } catch (err) {
    console.error("Compare GET error:", err);
    return NextResponse.json({ error: "Failed to load pair" }, { status: 500 });
  }
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

  try {
    const [winner, loser] = await Promise.all([
      getMediaById(winnerId),
      getMediaById(loserId),
    ]);

    if (!winner || !loser) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const { newWinnerElo, newLoserElo } = calculateEloUpdate(winner, loser);
    await updateEloRatings(
      winnerId,
      loserId,
      newWinnerElo,
      newLoserElo,
      winner.comparison_count,
      loser.comparison_count
    );

    return NextResponse.json({
      ok: true,
      winner: { id: winnerId, new_elo: Math.round(newWinnerElo) },
      loser: { id: loserId, new_elo: Math.round(newLoserElo) },
    });
  } catch (err) {
    console.error("Compare POST error:", err);
    return NextResponse.json({ error: "Failed to submit comparison" }, { status: 500 });
  }
}
