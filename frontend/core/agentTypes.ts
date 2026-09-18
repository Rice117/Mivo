// core/agentTypes.ts
// Types partagés par tous les agents et par l'orchestrateur.

import { ChannelId } from "./channels";

export type AgentId = "welcome" | "analysis" | "marketing" | "advertising" | "design" | "developer";

export type AgentStatus = "actif" | "en_attente" | "echec";

export type Trend = "hausse" | "baisse" | "stable";

export type Priority = "urgente" | "haute" | "normale";

export interface AgentMessage {
  agent: AgentId;
  content: string;
}

// Contexte partagé en temps réel entre les agents : chaque agent lit ce que
// les précédents ont déposé et y ajoute ses propres résultats, plutôt que de
// tourner isolément.
//
// Règle du projet : un agent ne redevine JAMAIS une décision prise par un
// autre. S'il a besoin d'une information, elle doit être déposée ici par
// celui qui l'a décidée.
export interface SharedContext {
  userName?: string;
  objective?: string;
  values?: number[];
  product?: string;
  adObjective?: string;
  dataLabel?: string; // d'où viennent les chiffres (nom du fichier, colonne)

  // déposé par analysisAgent
  trend?: Trend;
  anomalies?: { index: number; value: number }[];
  recommendations?: string[];

  // déposé par marketingAgent
  positioning?: string;
  channels?: ChannelId[];
  priority?: Priority;
  targetAudience?: string;

  // déposé par designAgent
  visualConcepts?: string[];
  colorPalette?: string[];
  postFormats?: string[];

  // déposé par advertisingAgent
  headline?: string;
  budgetSplit?: Record<string, number>;

  // utilisé par developerAgent
  codeRequest?: string;
  projectId?: string;

  messages: AgentMessage[];
}

export interface AgentDescriptor {
  id: AgentId;
  nom: string;
  role: string;
  statut: AgentStatus;
}

export interface AgentResult {
  agent: AgentId;
  status: "success" | "echec";
  [key: string]: unknown;
}

// Tout agent branché sur l'orchestrateur respecte ce contrat.
export interface Agent {
  run(context: SharedContext): AgentResult;
}

// Ce dont chaque agent a besoin pour travailler. L'orchestrateur et le
// planificateur s'en servent pour ne jamais lancer un agent dans le vide et
// pour compléter automatiquement un plan incomplet.
export const AGENT_DEPENDENCIES: Record<AgentId, AgentId[]> = {
  welcome: [],
  analysis: [],
  marketing: ["analysis"],
  design: ["marketing"],
  advertising: ["marketing"],
  developer: [],
};
