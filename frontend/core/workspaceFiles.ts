// core/workspaceFiles.ts
// Socle prêt pour l'agent Développeur — pas encore branché.
import { nowISO } from "../lib/ids";

export type ProjectFile = {
  path: string;
  content: string;
  updatedAt: string;
};

export type FileChange = {
  path: string;
  before?: string;
  after: string;
};

export type ProjectSnapshot = {
  projectId: string;
  files: Record<string, ProjectFile>;
};

export function createFile(snapshot: ProjectSnapshot, path: string, content: string): FileChange {
  const file: ProjectFile = { path, content, updatedAt: nowISO() };
  snapshot.files[path] = file;
  return { path, after: content };
}

export function updateFile(snapshot: ProjectSnapshot, path: string, content: string): FileChange {
  const before = snapshot.files[path]?.content;
  snapshot.files[path] = { path, content, updatedAt: nowISO() };
  return { path, before, after: content };
}
