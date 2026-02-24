import { NextResponse } from "next/server";
import { createInvite, markInviteSent, getSession } from "@/lib/sessions";
import { sendStakeholderDM } from "@/lib/slack";
import type { AddInviteRequest } from "@/types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const body = (await request.json()) as AddInviteRequest;
    const { name, slack_user_id, role_type } = body;

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const invite = await createInvite({
      sessionId,
      name,
      slackUserId: slack_user_id,
      roleType: role_type,
    });

    const formLink = `${APP_URL}/respond/${invite.token}`;

    if (slack_user_id) {
      try {
        await sendStakeholderDM({
          slackUserId: slack_user_id,
          stakeholderName: name,
          tapName: session.tap_name ?? "The Talent Team",
          hmName: "the hiring manager",
          jobFamily: session.job_family,
          formLink,
        });
        await markInviteSent(sessionId, invite.id);
      } catch (err) {
        console.error("Slack DM failed:", err);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        invite_id: invite.id,
        token: invite.token,
        form_link: formLink,
        slack_sent: !!slack_user_id,
      },
    });
  } catch (err) {
    console.error("Invite creation error:", err);
    return NextResponse.json({ success: false, error: "Failed to create invite" }, { status: 500 });
  }
}
