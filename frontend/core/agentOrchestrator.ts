// core/agentOrchestrator.ts
// Le chef d'orchestre : c'est LUI qui fait travailler les agents ensemble.
//
// Principe du projet, appliqué ici sans exception : tous les agents partagent
// un seul et même contexte. Analyse y dépose la tendance, Marketing la lit et
// y dépose sa stratégie, Design et Publicité lisent cette stratégie. Aucun
// agent ne recalcule ce qu'un autre a déjà décidé.
//
// Toutes les pages doivent passer par ici. Une page qui appellerait un agent
// dans son coin casserait précisément la chose que cette plateforme doit faire.

import { AGENT_DEPENDENCIES, AgentId, AgentResult, SharedContext } from "./agentTypes";
import { AGENT_REGISTRY } from "../lib/agents";
import { addMemory } from "../memory/projectMemory";
import { remember } from "../memory/agentMemory";

// La chaîne complète, dans l'ordre où les agents ont besoin les uns des autres.
export const DEFAULT_PIPELINE: AgentId[] = [
  "welcome",
  "analysis",
  "marketing",
  "design",
  "advertising",
];

export function createContext(input: Partial<SharedContext> = {}): SharedContext {
  return { projectId: "azuska", ...input, messages: input.messages ?? [] };
}

// Un agent a-t-il de quoi travailler ? On vérifie que ce dont il dépend a bien
// été déposé dans le contexte, pour renvoyer un message clair plutôt qu'un
// résultat inventé.
function missingDependency(agentId: AgentId, context: SharedContext): AgentId | null {
  for (const dep of AGENT_DEPENDENCIES[agentId]) {
    if (dep === "analysis" && !context.trend) return dep;
    if (dep === "marketing" && !context.positioning) return dep;
  }
  return null;
}

const AGENT_NAME: Record<AgentId, string> = {
  welcome: "Accueil",
  analysis: "Analyse",
  marketing: "Marketing",
  design: "Design",
  advertising: "Publicité",
  developer: "Développeur",
};

export function agentName(id: AgentId): string {
  return AGENT_NAME[id] ?? id;
}

export function runAgent(agentId: AgentId, context: SharedContext): AgentResult {
  const entry = AGENT_REGISTRY[agentId];
  const projectId = context.projectId ?? "azuska";

  if (!entry) {
    return { agent: agentId, status: "echec", raison: "type d'agent inconnu" };
  }

  let result: AgentResult;

  const missing = missingDependency(agentId, context);
  if (missing) {
    result = {
      agent: agentId,
      status: "echec",
      raison: `l'agent ${agentName(missing)} doit être exécuté avant l'agent ${agentName(agentId)}`,
    };
  } else if (agentId === "analysis" && (context.values ?? []).length === 0) {
    result = {
      agent: agentId,
      status: "echec",
      raison: "aucun chiffre à analyser : importe d'abord un fichier",
    };
  } else {
    result = entry.agent.run(context);
  }

  const summary =
    result.status === "success"
      ? `${entry.nom} a terminé.`
      : `${entry.nom} n'a pas pu travailler : ${String(result.raison ?? "raison inconnue")}`;

  addMemory(projectId, summary, agentId, result);
  remember(agentId, summary, result);

  return result;
}

export type PipelineRun = {
  results: Partial<Record<AgentId, AgentResult>>;
  order: AgentId[];
  messages: SharedContext["messages"];
  context: SharedContext;
  ok: boolean;
};

// Lance la chaîne complète sur un seul contexte partagé. Si un agent échoue,
// on s'arrête : les suivants dépendent de lui et n'inventeraient qu'un
// résultat sans valeur.
export function runPipeline(
  input: Partial<SharedContext>,
  pipeline: AgentId[] = DEFAULT_PIPELINE
): PipelineRun {
  const context = createContext(input);
  const results: Partial<Record<AgentId, AgentResult>> = {};
  const order: AgentId[] = [];
  let ok = true;

  for (const agentId of pipeline) {
    const result = runAgent(agentId, context);
    results[agentId] = result;
    order.push(agentId);
    if (result.status === "echec") {
      ok = false;
      break;
    }
  }

  return { results, order, messages: context.messages, context, ok };
}
