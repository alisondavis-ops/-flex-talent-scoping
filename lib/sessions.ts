import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { Redis } from "@upstash/redis";
import type { IntakeSession, StakeholderInvite, StakeholderResponse, StakeholderRole } from "@/types";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const TOKEN_EXPIRY_DAYS = 14;
const SESSION_TTL = 60 * 60 * 24 * 90; // 90 days in seconds

// ── Redis client ──────────────────────────────────────────────────────────────

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const key = (id: string) => `session:${id}`;

// ── Session CRUD ─────────────────────────────────────────────────────────────

export async function createSession(
  partial: Omit<IntakeSession, "id" | "created_at" | "updated_at" | "phase" | "invites" | "responses" | "synthesis">
): Promise<IntakeSession> {
  const session: IntakeSession = {
    ...partial,
    id: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    phase: "intake_complete",
    invites: [],
    responses: [],
    synthesis: null,
  };
  await redis.set(key(session.id), JSON.stringify(session), { ex: SESSION_TTL });
  return session;
}

export async function getSession(id: string): Promise<IntakeSession | null> {
  const raw = await redis.get<string>(key(id));
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : raw as IntakeSession;
}

export async function updateSession(id: string, updates: Partial<IntakeSession>): Promise<IntakeSession | null> {
  const session = await getSession(id);
  if (!session) return null;
  const updated = { ...session, ...updates, updated_at: new Date().toISOString() };
  await redis.set(key(id), JSON.stringify(updated), { ex: SESSION_TTL });
  return updated;
}

export async function getAllSessions(): Promise<IntakeSession[]> {
  const keys = await redis.keys("session:*");
  if (!keys.length) return [];
  const raws = await Promise.all(keys.map(k => redis.get<string>(k)));
  return raws
    .filter(Boolean)
    .map(r => (typeof r === "string" ? JSON.parse(r) : r) as IntakeSession)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ── Invites ───────────────────────────────────────────────────────────────────

export async function createInvite(params: {
  sessionId: string;
  name: string;
  slackUserId?: string;
  roleType: StakeholderRole;
}): Promise<StakeholderInvite> {
  const inviteId = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  const token = jwt.sign(
    { invite_id: inviteId, session_id: params.sessionId, roleType: params.roleType },
    JWT_SECRET,
    { expiresIn: `${TOKEN_EXPIRY_DAYS}d` }
  );

  const invite: StakeholderInvite = {
    id: inviteId,
    session_id: params.sessionId,
    name: params.name,
    slack_user_id: params.slackUserId,
    role_type: params.roleType,
    token,
    status: "pending",
    expires_at: expiresAt.toISOString(),
  };

  const session = await getSession(params.sessionId);
  if (session) {
    await updateSession(params.sessionId, {
      invites: [...session.invites, invite],
      phase: "stakeholders_invited",
    });
  }

  return invite;
}

export function validateToken(token: string): {
  inviteId: string;
  sessionId: string;
  roleType: StakeholderRole;
} | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      invite_id: string;
      session_id: string;
      roleType: StakeholderRole;
    };
    return {
      inviteId: decoded.invite_id,
      sessionId: decoded.session_id,
      roleType: decoded.roleType,
    };
  } catch {
    return null;
  }
}

export async function markInviteSent(sessionId: string, inviteId: string): Promise<void> {
  const session = await getSession(sessionId);
  if (!session) return;
  const invites = session.invites.map(inv =>
    inv.id === inviteId ? { ...inv, status: "sent" as const } : inv
  );
  await updateSession(sessionId, { invites });
}

export async function submitResponse(
  sessionId: string,
  inviteId: string,
  answers: StakeholderResponse["answers"],
  roleType: StakeholderRole
): Promise<StakeholderResponse> {
  const response: StakeholderResponse = {
    id: uuidv4(),
    invite_id: inviteId,
    session_id: sessionId,
    role_type: roleType,
    answers,
    submitted_at: new Date().toISOString(),
  };

  const session = await getSession(sessionId);
  if (session) {
    const invites = session.invites.map(inv =>
      inv.id === inviteId
        ? { ...inv, status: "submitted" as const, submitted_at: response.submitted_at }
        : inv
    );
    const responses = [...session.responses, response];
    const allSubmitted = invites.every(inv => inv.status === "submitted");
    await updateSession(sessionId, {
      invites,
      responses,
      phase: allSubmitted ? "synthesis_complete" : "stakeholders_invited",
    });
  }

  return response;
}

export async function allInvitesSubmitted(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session || session.invites.length === 0) return false;
  return session.invites.every(inv => inv.status === "submitted");
}
export async function deleteSession(id: string): Promise<boolean> {
  const exists = await getSession(id);
  if (!exists) return false;
  await redis.del(key(id));
  return true;
}
export async function deleteSession(id: string): Promise<boolean> {
  const exists = await getSession(id);
  if (!exists) return false;
  await redis.del(key(id));
  return true;
}