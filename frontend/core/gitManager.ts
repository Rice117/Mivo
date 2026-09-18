// core/gitManager.ts
// Socle prêt pour l'agent Développeur — pas encore branché.
import { nowISO } from "../lib/ids";

export type GitChange = {
  path: string;
  content: string;
  action: "create" | "update" | "delete";
};

export type CommitProposal = {
  branch: string;
  message: string;
  changes: GitChange[];
};

export function createBranchName(projectId: string): string {
  const slug = nowISO().replace(/[:.]/g, "-");
  return `azuska/${projectId}/${slug}`;
}

export function createCommitProposal(
  branch: string,
  message: string,
  changes: GitChange[]
): CommitProposal {
  return { branch, message, changes };
}
