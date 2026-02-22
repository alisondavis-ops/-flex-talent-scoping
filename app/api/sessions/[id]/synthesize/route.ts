import { NextResponse } from "next/server";
import { getSession, updateSession } from "@/lib/sessions";
import { synthesizeStakeholders } from "@/lib/claude";
import { updateNotionPage } from "@/lib/notion";
import { createSearchChannel } from "@/lib/slack";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = getSession(params.id);
    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    if (!session.ai_analysis) {
      return NextResponse.json(
        { success: false, error: "Initial analysis must complete before synthesis" },
        { status: 400 }
      );
    }

    if (session.responses.length === 0) {
      return NextResponse.json(
        { success: false, error: "No stakeholder responses to synthesize" },
        { status: 400 }
      );
    }

    const synthesis = await synthesizeStakeholders(
      session.hm_answers,
      session.responses,
      session.ai_analysis
    );

    updateSession(params.id, {
      synthesis,
      phase: "synthesis_complete",
    });

    let slackChannelId: string | undefined;
    let slackChannelName: string | undefined;
    try {
      const stakeholderSlackIds = session.invites
        .filter(inv => inv.slack_user_id)
        .map(inv => inv.slack_user_id!);

      const channel = await createSearchChannel({
        jobFamily: session.job_family,
        sessionId: params.id,
        tapSlackId: session.tap_slack_id ?? "",
        stakeholderSlackIds,
        synthesisSummary: synthesis.slack_summary,
      });
      slackChannelId = channel.channelId;
      slackChannelName = channel.channelName;

      updateSession(params.id, {
        slack_channel_id: slackChannelId,
        slack_channel_name: slackChannelName,
      });
    } catch (err) {
      console.error("Slack channel creation failed:", err);
    }

    if (session.notion_page_id) {
      try {
        await updateNotionPage(session.notion_page_id, {
          synthesis,
          phase: "synthesis_complete",
          slackChannel: slackChannelName,
        });
      } catch (err) {
        console.error("Notion update failed:", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        synthesis,
        slack_channel_id: slackChannelId,
        slack_channel_name: slackChannelName,
      },
    });
  } catch (err) {
    console.error("Synthesis error:", err);
    return NextResponse.json({ success: false, error: "Synthesis failed" }, { status: 500 });
  }
}