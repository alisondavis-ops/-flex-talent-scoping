const SLACK_TOKEN = process.env.SLACK_BOT_TOKEN!;
const SLACK_BASE = "https://slack.com/api";

async function slackPost(method: string, body: Record<string, unknown>) {
  if (process.env.SLACK_BOT_TOKEN === "skip") return { ok: true };

  const res = await fetch(`${SLACK_BASE}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack API error (${method}): ${data.error}`);
  return data;
}

export async function sendStakeholderDM(params: {
  slackUserId: string;
  stakeholderName: string;
  tapName: string;
  hmName: string;
  jobFamily: string;
  formLink: string;
}): Promise<void> {
  const { slackUserId, tapName, hmName, jobFamily, formLink } = params;

  await slackPost("chat.postMessage", {
    channel: slackUserId,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `👋 Hi there! *${tapName}* from the Flex Talent team has invited you to share your perspective on an open role.`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Role:* ${jobFamily} on ${hmName}'s team\n\nYour input is independent — no one else will see your specific answers. This takes about 8 minutes.`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Share my perspective →" },
            url: formLink,
            style: "primary",
          },
        ],
      },
    ],
  });
}

export async function notifyTAPSubmission(params: {
  tapSlackId: string;
  stakeholderName: string;
  stakeholderRole: string;
  sessionId: string;
  totalInvited: number;
  totalSubmitted: number;
  dashboardUrl: string;
}): Promise<void> {
  const { tapSlackId, stakeholderName, stakeholderRole, totalSubmitted, totalInvited, dashboardUrl } = params;
  const allDone = totalSubmitted === totalInvited;

  await slackPost("chat.postMessage", {
    channel: tapSlackId,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: allDone
            ? `✅ *All stakeholders have responded!* Synthesis is ready to run.`
            : `📝 *${stakeholderName}* (${stakeholderRole}) just submitted. ${totalSubmitted}/${totalInvited} responses in.`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: allDone ? "Run synthesis →" : "View dashboard →" },
            url: dashboardUrl,
            style: allDone ? "primary" : "default",
          },
        ],
      },
    ],
  });
}

export async function createSearchChannel(params: {
  jobFamily: string;
  sessionId: string;
  tapSlackId: string;
  stakeholderSlackIds: string[];
  synthesisSummary: string;
}): Promise<{ channelId: string; channelName: string }> {
  if (process.env.SLACK_BOT_TOKEN === "skip") {
    return { channelId: "skip", channelName: "skip" };
  }

  const { jobFamily, sessionId, tapSlackId, stakeholderSlackIds, synthesisSummary } = params;

  const shortId = sessionId.slice(0, 6);
  const channelName = `search-${jobFamily.toLowerCase().replace(/[\s\/]+/g, "-").replace(/[^a-z0-9-]/g, "")}-${shortId}`;

  const createRes = await slackPost("conversations.create", {
    name: channelName,
    is_private: false,
  });
  const channelId = createRes.channel.id;

  const allUsers = [tapSlackId, ...stakeholderSlackIds].filter(Boolean);
  if (allUsers.length > 0) {
    await slackPost("conversations.invite", {
      channel: channelId,
      users: allUsers.join(","),
    });
  }

  await slackPost("chat.postMessage", {
    channel: channelId,
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `🔍 ${jobFamily} — Search Alignment` },
      },
      {
        type: "section",
        text: { type: "mrkdwn", text: synthesisSummary },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "📋 *Next step:* The TAP will schedule an alignment call to work through open questions before the search launches.",
        },
      },
    ],
  });

  return { channelId, channelName };
}