// lib/agents/developerAgent.ts
// Agent Développeur : à partir d'une demande en langage naturel, il PROPOSE un
// plan de fichiers à créer ou à modifier. Il n'écrit jamais rien tout seul.
//
// Règle de gouvernance du projet, respectée ici : l'agent prépare, explique,
// demande confirmation — et c'est seulement après la confirmation de Riche que
// quoi que ce soit est écrit. Le moteur d'exécution (core/executionEngine.ts)
// met automatiquement la chaîne en pause avant cet agent.

import { Agent, AgentResult, SharedContext } from "../../core/agentTypes";
import { newId } from "../ids";
import { CodeChange, CodeResult, CodeTask } from "./developerTypes";

function slug(text: string): string {
  return (
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "") // enlève les accents
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "demande"
  );
}

function guessAction(path: string, existingFiles: string[]): CodeChange["action"] {
  return existingFiles.includes(path) ? "update" : "create";
}

export function planChanges(task: CodeTask): CodeResult {
  const existing = task.existingFiles ?? [];
  const name = slug(task.description);
  const targetPath = `generated/${task.projectId}/${name}.ts`;

  const changes: CodeChange[] = [
    {
      path: targetPath,
      content: `// Généré à partir de la demande : "${task.description}"\n// TODO: implémentation réelle\n`,
      action: guessAction(targetPath, existing),
    },
  ];

  return {
    changes,
    summary: `Plan proposé pour : ${task.description}`,
    requiresTests: true,
  };
}

export const developerAgent: Agent & {
  generateCode(task: CodeTask): Promise<CodeResult>;
} = {
  async generateCode(task: CodeTask): Promise<CodeResult> {
    return planChanges(task);
  },

  run(context: SharedContext): AgentResult {
    const description = context.codeRequest ?? context.objective;

    if (!description) {
      return {
        agent: "developer",
        status: "echec",
        raison: "aucune demande de code : décris ce que tu veux construire dans le Centre de commande",
      };
    }

    const plan = planChanges({
      id: newId("task"),
      description,
      projectId: context.projectId ?? "azuska",
    });

    context.messages.push({
      agent: "developer",
      content: `${plan.summary} — ${plan.changes.length} fichier(s) proposé(s). Rien n'est écrit tant que tu n'as pas validé.`,
    });

    return {
      agent: "developer",
      status: "success",
      resume: plan.summary,
      fichiers_proposes: plan.changes.map((c) => ({ chemin: c.path, action: c.action })),
      tests_requis: plan.requiresTests,
      ecrit_sur_le_disque: false,
    };
  },
};
