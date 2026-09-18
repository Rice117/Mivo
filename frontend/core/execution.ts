// core/execution.ts
// L'état d'une exécution lancée depuis le Centre de commande.

import { AgentId, AgentResult, SharedContext } from "./agentTypes";

export type ExecutionStatus = "pending" | "running" | "paused" | "completed" | "failed";

export type StepOutcome = {
  agent: AgentId;
  result: AgentResult;
};

export type Execution = {
  id: string;
  projectId: string;
  request: string;
  status: ExecutionStatus;
  currentStep: number;
  results: StepOutcome[];
  errors: string[];
  context: SharedContext;
  // Renseigné quand l'exécution s'arrête et attend une confirmation.
  awaitingApproval?: { agent: AgentId; explanation: string };
  approved: AgentId[];
};
