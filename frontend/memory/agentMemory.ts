// memory/agentMemory.ts
// Mémoire par agent : ce que chaque agent a produit, dans l'ordre.

import { AgentId, AgentResult } from "../core/agentTypes";
import { nowISO } from "../lib/ids";

export type AgentMemoryEntry = {
  agentId: AgentId;
  information: string;
  result?: AgentResult;
  createdAt: string;
};

const entries: AgentMemoryEntry[] = [];

export function remember(
  agentId: AgentId,
  information: string,
  result?: AgentResult
): AgentMemoryEntry {
  const entry: AgentMemoryEntry = { agentId, information, result, createdAt: nowISO() };
  entries.push(entry);
  return entry;
}

export function recall(agentId: AgentId): AgentMemoryEntry[] {
  return entries.filter((e) => e.agentId === agentId);
}

export function clearAgentMemory(): void {
  entries.length = 0;
}
