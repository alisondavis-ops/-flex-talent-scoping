import { NextResponse } from "next/server";
import { getSession } from "@/lib/sessions";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession(params.id);
  if (!session) {
    return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: session });
}
