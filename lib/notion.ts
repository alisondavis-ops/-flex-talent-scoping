import { Client } from "@notionhq/client";
import type { IntakeSession, SynthesisResult } from "@/types";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const DB_ID = process.env.NOTION_DATABASE_ID!;

export async function createNotionPage(session: IntakeSession): Promise<string> {
  if (process.env.NOTION_API_KEY === "skip") return "skip";

  const { hm_answers, ai_analysis, job_family, track } = session;
  const levelRec = ai_analysis?.level_analysis.recommended_level;
  const levelRequested = hm_answers.hm_level_pick;

  const response = await notion.pages.create({
    parent: { database_id: DB_ID },
    properties: {
      "Name": {
        title: [{ text: { content: `${job_family} — ${session.id.slice(0, 8)}` } }],
      },
      "Session ID": {
        rich_text: [{ text: { content: session.id } }],
      },
      "Job Family": {
        select: { name: job_family },
      },
      "Track": {
        select: { name: track },
      },
      "Phase": {
        select: { name: session.phase },
      },
      "HM Level Request": {
        rich_text: [{ text: { content: levelRequested ?? "" } }],
      },
      "AI Level Recommendation": {
        rich_text: [{ text: { content: levelRec ? `L${levelRec}` : "Pending" } }],
      },
      "Level Match": {
        checkbox: ai_analysis?.level_analysis.level_match ?? false,
      },
      "Created": {
        date: { start: session.created_at },
      },
    },
    children: [
      {
        object: "block" as const,
        type: "heading_1" as const,
        heading_1: {
          rich_text: [{ text: { content: `${job_family} — Intake Analysis` } }],
        },
      },
      {
        object: "block" as const,
        type: "paragraph" as const,
        paragraph: {
          rich_text: [{
            text: { content: ai_analysis?.tap_brief.summary ?? "Analysis pending..." },
          }],
        },
      },
    ],
  });

  return response.id;
}

export async function updateNotionPage(
  pageId: string,
  updates: {
    phase?: string;
    synthesis?: SynthesisResult;
    slackChannel?: string;
  }
): Promise<void> {
  if (process.env.NOTION_API_KEY === "skip" || pageId === "skip") return;

  const properties: Record<string, unknown> = {};

  if (updates.phase) {
    properties["Phase"] = { select: { name: updates.phase } };
  }
  if (updates.slackChannel) {
    properties["Slack Channel"] = {
      rich_text: [{ text: { content: updates.slackChannel } }],
    };
  }

  if (Object.keys(properties).length > 0) {
    await notion.pages.update({ page_id: pageId, properties: properties as Parameters<typeof notion.pages.update>[0]["properties"] });
  }
}