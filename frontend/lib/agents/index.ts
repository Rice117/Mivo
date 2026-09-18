// lib/agents/index.ts
// Registre unique des agents. Ajouter une entrée ici suffit pour qu'un nouvel
// agent soit disponible partout : orchestrateur, Centre de commande, pages.
//
// Le contrôle `Record<AgentId, ...>` ci-dessous est volontaire : si un agent
// est déclaré dans AgentId mais oublié ici, TypeScript le signale tout de
// suite. C'est exactement l'oubli (l'agent Développeur absent du registre) qui
// empêchait toute l'application de se construire.

import { Agent, AgentDescriptor, AgentId } from "../../core/agentTypes";
import { welcomeAgent } from "./welcomeAgent";
import { analysisAgent } from "./analysisAgent";
import { marketingAgent } from "./marketingAgent";
import { advertisingAgent } from "./advertisingAgent";
import { designAgent } from "./designAgent";
import { developerAgent } from "./developerAgent";

export type AgentEntry = {
  nom: string;
  role: string;
  agent: Agent;
};

export const AGENT_REGISTRY: Record<AgentId, AgentEntry> = {
  welcome: {
    nom: "Agent Accueil",
    role: "Accueille l'utilisateur",
    agent: welcomeAgent,
  },
  analysis: {
    nom: "Agent Analyse",
    role: "Analyse les chiffres importés : tendance, valeurs inhabituelles, recommandations",
    agent: analysisAgent,
  },
  marketing: {
    nom: "Agent Marketing",
    role: "Définit la stratégie à partir de la tendance détectée par l'agent Analyse",
    agent: marketingAgent,
  },
  design: {
    nom: "Agent Design",
    role: "Conçoit les visuels et publications à partir de la stratégie marketing",
    agent: designAgent,
  },
  advertising: {
    nom: "Agent Publicité",
    role: "Crée la campagne et répartit le budget à partir de la stratégie",
    agent: advertisingAgent,
  },
  developer: {
    nom: "Agent Développeur",
    role: "Propose un plan de code à partir d'une demande — n'écrit rien sans validation",
    agent: developerAgent,
  },
};

export const AGENT_IDS = Object.keys(AGENT_REGISTRY) as AgentId[];

export function listAgents(): AgentDescriptor[] {
  return AGENT_IDS.map((id) => ({
    id,
    nom: AGENT_REGISTRY[id].nom,
    role: AGENT_REGISTRY[id].role,
    statut: "actif",
  }));
}

export { welcomeAgent, analysisAgent, marketingAgent, designAgent, advertisingAgent, developerAgent };
