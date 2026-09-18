// core/executionEngine.ts
// Le moteur qui exécute réellement un plan.
//
// Avant, ce fichier n'appelait aucun agent : il empilait le nom des étapes
// dans une liste. Le Centre de commande affichait donc un plan que rien
// n'exécutait. Il fait maintenant tourner les vrais agents, sur un seul
// contexte partagé, et s'arrête AVANT toute action sensible.
//
// Le flux de gouvernance du projet est respecté à la lettre :
//   l'agent prépare -> le moteur explique -> Riche confirme -> le moteur agit.

import { AgentId, SharedContext } from "./agentTypes";
import { agentName, runAgent } from "./agentOrchestrator";
import { ExecutionPlan } from "./agentPlanner";
import { Execution } from "./execution";
import { newId } from "../lib/ids";

const EXPLANATIONS: Partial<Record<AgentId, string>> = {
  advertising:
    "L'agent Publicité va créer une campagne et répartir un budget entre les canaux. Rien n'est diffusé ni payé : la campagne est seulement préparée pour que tu la relises.",
  developer:
    "L'agent Développeur va proposer des fichiers de code à créer ou modifier. Rien n'est écrit sur le disque tant que tu n'as pas validé le détail.",
};

export function explainStep(agent: AgentId): string {
  return (
    EXPLANATIONS[agent] ??
    `L'agent ${agentName(agent)} va s'exécuter à partir de ce que les agents précédents ont produit.`
  );
}

export function createExecution(
  plan: ExecutionPlan,
  context: SharedContext,
  projectId = "azuska"
): Execution {
  return {
    id: newId("exec"),
    projectId,
    request: plan.request,
    status: "pending",
    currentStep: 0,
    results: [],
    errors: [],
    context,
    approved: [],
  };
}

// Avance dans le plan jusqu'à la fin, jusqu'à une erreur, ou jusqu'à une étape
// sensible pas encore confirmée. Renvoie une nouvelle exécution — l'objet
// d'origine n'est pas modifié, pour que React affiche toujours un état propre.
export async function executePlan(
  execution: Execution,
  plan: ExecutionPlan
): Promise<Execution> {
  const next: Execution = {
    ...execution,
    status: "running",
    results: [...execution.results],
    errors: [...execution.errors],
    awaitingApproval: undefined,
  };

  for (let i = next.currentStep; i < plan.steps.length; i++) {
    const step = plan.steps[i];

    if (step.requiresApproval && !next.approved.includes(step.agent)) {
      next.status = "paused";
      next.currentStep = i;
      next.awaitingApproval = { agent: step.agent, explanation: explainStep(step.agent) };
      return next;
    }

    try {
      const result = runAgent(step.agent, next.context);
      next.results.push({ agent: step.agent, result });
      next.currentStep = i + 1;

      if (result.status === "echec") {
        next.status = "failed";
        next.errors.push(
          `${agentName(step.agent)} : ${String(result.raison ?? "raison inconnue")}`
        );
        return next;
      }
    } catch (err) {
      next.status = "failed";
      next.currentStep = i;
      next.errors.push(`${agentName(step.agent)} : ${String(err)}`);
      return next;
    }
  }

  next.status = "completed";
  return next;
}

// Riche a confirmé l'étape sensible : on l'autorise puis on reprend là où on
// s'était arrêté.
export async function approveAndContinue(
  execution: Execution,
  plan: ExecutionPlan
): Promise<Execution> {
  if (!execution.awaitingApproval) return execution;
  const approved = [...execution.approved, execution.awaitingApproval.agent];
  return executePlan({ ...execution, approved, awaitingApproval: undefined }, plan);
}

// Riche refuse l'étape sensible : on s'arrête proprement, en gardant ce qui a
// déjà été produit par les agents précédents.
export function refuseStep(execution: Execution): Execution {
  if (!execution.awaitingApproval) return execution;
  return {
    ...execution,
    status: "completed",
    awaitingApproval: undefined,
    errors: [
      ...execution.errors,
      `Étape « ${agentName(execution.awaitingApproval.agent)} » refusée — le reste du travail est conservé.`,
    ],
  };
}
