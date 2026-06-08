import { NextRequest, NextResponse } from "next/server";
import { getRankings } from "@/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const type = new URL(request.url).searchParams.get("type") ?? "movie";

  if (type !== "movie" && type !== "tv") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  try {
    const items = await getRankings(type);
    return NextResponse.json(items);
  } catch (err) {
    console.error("Rankings error:", err);
    return NextResponse.json({ error: "Failed to load rankings" }, { status: 500 });
  }
}
