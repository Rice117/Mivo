// lib/agents/developerTypes.ts
// Types utilisés par developerAgent.ts — fichier qui manquait et bloquait
// la compilation.

export type CodeTask = {
  id: string;
  description: string; // demande en langage naturel
  projectId: string;
  existingFiles?: string[]; // fichiers déjà existants à modifier plutôt qu'à créer
};

export type CodeChangeAction = "create" | "update" | "delete";

export type CodeChange = {
  path: string;
  content: string;
  action: CodeChangeAction;
};

export type CodeResult = {
  changes: CodeChange[];
  summary: string;
  requiresTests: boolean;
};
