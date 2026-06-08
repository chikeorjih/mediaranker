import { NextRequest, NextResponse } from "next/server";
import { getRankings } from "@/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const type = new URL(request.url).searchParams.get("type") ?? "movie";

  if (type !== "movie" && type !== "tv") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const items = getRankings(type);
  return NextResponse.json(items);
}
