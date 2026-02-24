import { NextResponse } from "next/server";
import { getSession } from "@/lib/sessions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getSession(id);
  if (!session) {
    return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: session });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { deleteSession } = await import("@/lib/sessions");
  const deleted = await deleteSession(id);
  if (!deleted) {
    return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}