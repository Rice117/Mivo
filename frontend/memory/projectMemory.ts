// memory/projectMemory.ts
// Mémoire du projet : la trace de tout ce que les agents ont fait.
//
// C'est la SEULE mémoire du projet. L'orchestrateur en avait auparavant une
// copie privée, si bien que la page « Vue d'ensemble » comptait des entrées
// qui n'étaient pas celles enregistrées ailleurs.
//
// Limite assumée aujourd'hui : cette mémoire vit dans la page. Elle est
// remise à zéro au rechargement. Le remplacement par Supabase est prévu.

import { AgentId, AgentResult } from "../core/agentTypes";
import { newId, nowISO } from "../lib/ids";

export type MemoryItem = {
  id: string;
  projectId: string;
  agent?: AgentId;
  content: string;
  result?: AgentResult;
  createdAt: string;
};

const items: MemoryItem[] = [];

export function addMemory(
  projectId: string,
  content: string,
  agent?: AgentId,
  result?: AgentResult
): MemoryItem {
  const item: MemoryItem = {
    id: newId("mem"),
    projectId,
    agent,
    content,
    result,
    createdAt: nowISO(),
  };
  items.push(item);
  return item;
}

export function getMemory(projectId: string): MemoryItem[] {
  return items.filter((m) => m.projectId === projectId);
}

export function allMemory(): MemoryItem[] {
  return [...items];
}

export function countMemory(): number {
  return items.length;
}

export function clearMemory(): void {
  items.length = 0;
}
