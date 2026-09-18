// core/activityLog.ts
// Socle prêt pour le journal durable — pas encore branché sur une base.

import { newId, nowISO } from "../lib/ids";

export type ActivityType =
  | "agent_started"
  | "agent_completed"
  | "approval_required"
  | "error"
  | "system";

export type Activity = {
  id: string;
  projectId: string;
  agentId?: string;
  type: ActivityType;
  message: string;
  createdAt: string;
};

export function createActivity(
  projectId: string,
  type: ActivityType,
  message: string,
  agentId?: string
): Activity {
  return {
    id: newId("act"),
    projectId,
    agentId,
    type,
    message,
    createdAt: nowISO(),
  };
}
