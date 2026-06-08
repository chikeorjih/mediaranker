import { NextRequest, NextResponse } from "next/server";
import { deleteMedia, getMediaById } from "@/db";

export const runtime = "nodejs";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const item = getMediaById(id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  deleteMedia(id);
  return new NextResponse(null, { status: 204 });
}
