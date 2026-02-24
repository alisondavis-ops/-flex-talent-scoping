// ─── Core Data Types ──────────────────────────────────────────────────────────

export type Track = "product" | "engineering" | "marketing" | "revenue" | "ga";
export type Level = 4 | 5 | 6 | 7 | 8 | 9;
export type StakeholderRole = "hiring_manager" | "cross_functional_partner" | "key_stakeholder" | "department_lead" | "dri";
export type SessionPhase = "intake_complete" | "stakeholders_invited" | "synthesis_complete" | "closed";
export type TensionSeverity = "high" | "medium" | "low";
export type InviteStatus = "pending" | "sent" | "submitted" | "expired";

export interface HMAnswers {
  job_family: string;
  track: Track;
  org_area: string;
  people_management: string;
  ic_vs_manager: string;
  success: string;
  failure: string;
  backfill: string;
  competitors: string;
  location: string;
  location_notes?: string;
  hm_level_pick: string;
  hm_level_rationale: string;
  role_title?: string;
  hiring_id?: string;
  reports_to?: string;
  day_to_day?: string;
  [key: string]: string | undefined;
}

export interface LevelAnalysis {
  recommended_level: Level;
  hm_requested_level: Level;
  level_match: boolean;
  tension_flag: boolean;
  reasoning: string;
  scope_assessment: string;
  impact_assessment: string;
  people_assessment: string;
  autonomy_assessment: string;
  ambiguity_assessment: string;
  attribute_fit: Record<string, string>;
}

export interface Tension {
  id: string;
  title: string;
  description: string;
  severity: TensionSeverity;
  probing_question: string;
  source: "hm_intake" | "stakeholder_synthesis";
}

export interface TAPBrief {
  summary: string;
  priority_questions: string[];
  watch_items: string[];
  level_signal: string;
  candidate_profile_notes: string;
}

export interface JDDraft {
  job_title: string;
  level_label: string;
  about_the_role: string;
  what_you_will_do: string[];
  what_we_are_looking_for: string[];
  nice_to_have: string[];
  location_statement: string;
}

export interface InterviewStage {
  stage_name: string;
  stage_type: string;
  duration_minutes: number;
  interviewer_type: string;
  focus_areas: string[];
  sample_questions: string[];
  attributes_assessed: string[];
}

export interface InterviewPlan {
  stages: InterviewStage[];
  overall_notes: string;
  attribute_mapping: Record<string, string[]>;
}

export interface SourcingChannel {
  channel: string;
  rationale: string;
  priority: "primary" | "secondary";
}

export interface SourcingStrategy {
  headline: string;
  target_companies: string[];
  target_titles: string[];
  search_strings: string[];
  channels: SourcingChannel[];
  outreach_angle: string;
}

export interface AIAnalysisResult {
  level_analysis: LevelAnalysis;
  tensions: Tension[];
  tap_brief: TAPBrief;
  jd_draft: JDDraft;
  interview_plan: InterviewPlan;
  sourcing_strategy: SourcingStrategy;
}

export interface StakeholderInvite {
  id: string;
  session_id: string;
  name: string;
  slack_user_id?: string;
  role_type: StakeholderRole;
  token: string;
  status: InviteStatus;
  expires_at: string;
  submitted_at?: string;
}

export interface StakeholderAnswers {
  level_expectation: string;
  level_rationale: string;
  success_definition: string;
  [key: string]: string | undefined;
}

export interface StakeholderResponse {
  id: string;
  invite_id: string;
  session_id: string;
  role_type: StakeholderRole;
  answers: StakeholderAnswers;
  submitted_at: string;
}

export interface LevelSpreadEntry {
  respondent: string;
  role_type: StakeholderRole;
  level_pick: Level;
  rationale_summary: string;
}

export interface SynthesisTension extends Tension {
  respondents_involved: string[];
}

export interface SynthesisResult {
  level_spread: LevelSpreadEntry[];
  level_consensus: Level | null;
  level_divergence_flag: boolean;
  tensions: SynthesisTension[];
  probing_questions: string[];
  slack_summary: string;
  tap_private_brief: string;
  notion_summary: string;
  jd_draft?: JDDraft;
  interview_plan?: InterviewPlan;
  sourcing_strategy?: SourcingStrategy;
}

export interface IntakeSession {
  id: string;
  created_at: string;
  updated_at: string;
  phase: SessionPhase;
  hm_answers: HMAnswers;
  job_family: string;
  track: Track;
  ai_analysis: AIAnalysisResult | null;
  invites: StakeholderInvite[];
  responses: StakeholderResponse[];
  synthesis: SynthesisResult | null;
  notion_page_id?: string;
  slack_channel_id?: string;
  slack_channel_name?: string;
  tap_slack_id?: string;
  tap_name?: string;
}

export interface CreateSessionRequest {
  hm_answers: HMAnswers;
  job_family: string;
  track: Track;
}

export interface SubmitResponseRequest {
  answers: StakeholderAnswers;
}

export interface AddInviteRequest {
  session_id: string;
  name: string;
  slack_user_id?: string;
  role_type: StakeholderRole;
}
