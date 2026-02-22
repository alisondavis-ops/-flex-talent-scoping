import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import type { IntakeSession, StakeholderInvite, StakeholderResponse, StakeholderRole } from "@/types";

const sessionCache = new Map<string, IntakeSession>();
const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-in-production";
const TOKEN_EXPIRY_DAYS = 14;

export function createSession(partial: Omit<IntakeSession, "id" | "created_at" | "updated_at" | "phase" | "invites" | "responses" | "synthesis">): IntakeSession {
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
  sessionCache.set(session.id, session);
  return session;
}

export function getSession(id: string): IntakeSession | null {
  return sessionCache.get(id) ?? null;
}

export function updateSession(id: string, updates: Partial<IntakeSession>): IntakeSession | null {
  const session = sessionCache.get(id);
  if (!session) return null;
  const updated = { ...session, ...updates, updated_at: new Date().toISOString() };
  sessionCache.set(id, updated);
  return updated;
}

export function getAllSessions(): IntakeSession[] {
  return Array.from(sessionCache.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export function createInvite(params: {
  sessionId: string;
  name: string;
  slackUserId?: string;
  roleType: StakeholderRole;
}): StakeholderInvite {
  const inviteId = uuidv4();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  const token = jwt.sign(
    { invite_id: inviteId, session_id: params.sessionId, role_type: params.roleType },
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

  const session = getSession(params.sessionId);
  if (session) {
    updateSession(params.sessionId, {
      invites: [...session.invites, invite],
      phase: "stakeholders_invited",
    });
  }

  return invite;
}

export function validateToken(token: string): { inviteId: string; sessionId: string; roleType: StakeholderRole } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      invite_id: string;
      session_id: string;
      role_type: StakeholderRole;
    };
    return {
      inviteId: decoded.invite_id,
      sessionId: decoded.session_id,
      roleType: decoded.role_type,
    };
  } catch {
    return null;
  }
}

export function markInviteSent(sessionId: string, inviteId: string): void {
  const session = getSession(sessionId);
  if (!session) return;
  const invites = session.invites.map(inv =>
    inv.id === inviteId ? { ...inv, status: "sent" as const } : inv
  );
  updateSession(sessionId, { invites });
}

export function submitResponse(
  sessionId: string,
  inviteId: string,
  answers: StakeholderResponse["answers"],
  roleType: StakeholderRole
): StakeholderResponse {
  const response: StakeholderResponse = {
    id: uuidv4(),
    invite_id: inviteId,
    session_id: sessionId,
    role_type: roleType,
    answers,
    submitted_at: new Date().toISOString(),
  };

  const session = getSession(sessionId);
  if (session) {
    const invites = session.invites.map(inv =>
      inv.id === inviteId
        ? { ...inv, status: "submitted" as const, submitted_at: response.submitted_at }
        : inv
    );
    const responses = [...session.responses, response];
    const allSubmitted = invites.every(inv => inv.status === "submitted");
    updateSession(sessionId, {
      invites,
      responses,
      phase: allSubmitted ? "synthesis_complete" : "stakeholders_invited",
    });
  }

  return response;
}

export function allInvitesSubmitted(sessionId: string): boolean {
  const session = getSession(sessionId);
  if (!session || session.invites.length === 0) return false;
  return session.invites.every(inv => inv.status === "submitted");
}