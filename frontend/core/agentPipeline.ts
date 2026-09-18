// core/agentPipeline.ts
// Le point d'entrée unique des pages : « voilà mes chiffres et mon produit,
// fais travailler les agents ».
//
// Toutes les pages appellent cette fonction. Aucune page ne rejoue la chaîne
// dans son coin — c'est ce qui garantit que ce qui s'affiche à l'écran est
// bien le fruit du travail des agents les uns après les autres, sur un seul
// contexte partagé.

import { AgentId } from "./agentTypes";
import { DEFAULT_PIPELINE, PipelineRun, runPipeline } from "./agentOrchestrator";

export type PipelineInput = {
  values: number[];
  product?: string;
  objective?: string;
  adObjective?: string;
  userName?: string;
  dataLabel?: string;
  projectId?: string;
};

export function runFullPipeline(input: PipelineInput, pipeline: AgentId[] = DEFAULT_PIPELINE): PipelineRun {
  return runPipeline(
    {
      values: input.values,
      product: input.product?.trim() || undefined,
      objective: input.objective?.trim() || undefined,
      adObjective: input.adObjective?.trim() || undefined,
      userName: input.userName?.trim() || undefined,
      dataLabel: input.dataLabel,
      projectId: input.projectId ?? "azuska",
    },
    pipeline
  );
}

// Raccourci utilisé par les pages qui n'affichent qu'une partie de la chaîne :
// la chaîne complète tourne quand même, seule la présentation change.
export const PIPELINE_UP_TO: Record<string, AgentId[]> = {
  analysis: ["analysis"],
  marketing: ["analysis", "marketing"],
  design: ["analysis", "marketing", "design"],
  advertising: ["analysis", "marketing", "design", "advertising"],
};
