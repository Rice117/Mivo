// core/agentPlanner.ts
// Centre de commande : transforme une phrase en français en un plan d'étapes.
//
// Deux choses qui manquaient et qui rendaient le plan inapplicable :
//  1. les accents et le pluriel faisaient rater des mots-clés ;
//  2. le plan ne contenait QUE ce qui était demandé. « Prépare une campagne
//     publicitaire » donnait une seule étape, Publicité — qui échouait faute
//     de stratégie marketing. Le plan complète maintenant tout seul les
//     étapes dont dépend la demande, et le dit.

import { AGENT_DEPENDENCIES, AgentId } from "./agentTypes";
import { DEFAULT_PIPELINE } from "./agentOrchestrator";

export type PlanStep = {
  agent: AgentId;
  reason: string;
  requiresApproval: boolean;
  added: boolean; // true = étape ajoutée automatiquement comme prérequis
};

export type ExecutionPlan = {
  request: string;
  locale: string;
  steps: PlanStep[];
};

// Les actions sensibles : elles ne sont jamais exécutées sans que Riche ait
// confirmé. Publicité engage de l'argent, Développeur touche au code.
export const SENSITIVE_AGENTS: AgentId[] = ["advertising", "developer"];

const KEYWORDS: { agent: AgentId; words: string[] }[] = [
  { agent: "analysis", words: ["analyse", "analyser", "vente", "chiffre", "donnee", "tendance", "resultat"] },
  { agent: "marketing", words: ["marketing", "strategie", "positionnement", "client", "canal", "canaux"] },
  { agent: "design", words: ["design", "visuel", "image", "publication", "reseaux sociaux", "post", "couleur", "affiche"] },
  { agent: "advertising", words: ["publicite", "campagne", "annonce", "budget", "promotion"] },
  { agent: "developer", words: ["code", "application", "site", "programme", "fonctionnalite", "bouton", "page"] },
];

// Enlève les accents et met en minuscules, pour que « publicité », « PUBLICITE »
// et « publicite » soient reconnus de la même façon.
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Remonte toute la chaîne des dépendances d'un agent (Design a besoin de
// Marketing, qui a besoin d'Analyse).
function withDependencies(agent: AgentId, found: Set<AgentId>): void {
  for (const dep of AGENT_DEPENDENCIES[agent]) {
    if (!found.has(dep)) {
      found.add(dep);
      withDependencies(dep, found);
    }
  }
}

export function createPlan(request: string, locale = "fr"): ExecutionPlan {
  const normalized = normalize(request);

  const requested = new Set<AgentId>();
  for (const entry of KEYWORDS) {
    if (entry.words.some((w) => normalized.includes(w))) {
      requested.add(entry.agent);
    }
  }

  if (requested.size === 0) {
    return {
      request,
      locale,
      steps: [
        {
          agent: "welcome",
          reason: "Aucun mot-clé reconnu — dis par exemple « analyse mes ventes » ou « propose une campagne ».",
          requiresApproval: false,
          added: false,
        },
      ],
    };
  }

  // On complète avec tout ce dont la demande dépend.
  const needed = new Set<AgentId>(requested);
  for (const agent of requested) withDependencies(agent, needed);

  // Puis on remet les étapes dans l'ordre de la chaîne, jamais dans l'ordre
  // où les mots apparaissent dans la phrase.
  const ordered = DEFAULT_PIPELINE.filter((id) => needed.has(id));
  const extras = [...needed].filter((id) => !DEFAULT_PIPELINE.includes(id));

  const steps: PlanStep[] = [...ordered, ...extras].map((agent) => {
    const added = !requested.has(agent);
    return {
      agent,
      reason: added
        ? `Étape ajoutée automatiquement : l'agent suivant en a besoin pour travailler.`
        : `Demandé dans ta phrase.`,
      requiresApproval: SENSITIVE_AGENTS.includes(agent),
      added,
    };
  });

  return { request, locale, steps };
}
