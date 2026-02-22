import { NextResponse } from "next/server";
import type { CreateSessionRequest } from "@/types";
import { analyzeIntake } from "@/lib/claude";
import { createSession } from "@/lib/sessions";
import { createNotionPage } from "@/lib/notion";

const TRACK_MAP: Record<string, string[]> = {
  product:     ["Core Product", "Design"],
  engineering: ["Software Engineering", "Data Engineering", "Analytics", "Machine Learning", "Data Science", "Information Technology", "Security Engineering", "Quality Assurance"],
  marketing:   ["Brand Marketing", "Product Marketing", "Creative", "Social Media", "Growth Marketing"],
  revenue:     ["Business Development", "Partner Success", "Account Executive", "Sales Development", "Sales Engineering", "Revenue Operations", "Partner Implementation"],
  ga:          ["Talent Acquisition", "People Ops", "Customer Success", "Operations", "Legal", "Strategic Finance / CM&T", "Accounting", "Compliance", "Credit Risk", "Risk Operations", "Office Management", "Project Management", "Strategy"],
};

function detectTrack(jobFamily: string): string {
  for (const [track, families] of Object.entries(TRACK_MAP)) {
    if (families.includes(jobFamily)) return track;
  }
  return "ga";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateSessionRequest;
    const { hm_answers, job_family } = body;

    if (!hm_answers || !job_family) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const track = detectTrack(job_family) as CreateSessionRequest["track"];

    const session = createSession({
      hm_answers,
      job_family,
      track,
      ai_analysis: null,
    });

    let ai_analysis = null;
    try {
      ai_analysis = await analyzeIntake(hm_answers, track, job_family);
      session.ai_analysis = ai_analysis;
    } catch (err) {
      console.error("Claude analysis failed:", err);
    }

    let notionPageId: string | undefined;
    try {
      const sessionWithAnalysis = { ...session, ai_analysis };
      notionPageId = await createNotionPage(sessionWithAnalysis);
      session.notion_page_id = notionPageId;
    } catch (err) {
      console.error("Notion write failed:", err);
    }

    return NextResponse.json({
      success: true,
      data: {
        session_id: session.id,
        analysis: ai_analysis,
        notion_page_id: notionPageId,
      },
    });
  } catch (err) {
    console.error("Session creation error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create session" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const { getAllSessions } = await import("@/lib/sessions");
  const sessions = getAllSessions();
  return NextResponse.json({ success: true, data: sessions });
}
