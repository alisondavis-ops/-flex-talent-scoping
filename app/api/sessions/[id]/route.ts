import { NextResponse } from "next/server";
import { getSession } from "@/lib/sessions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: session });
}
