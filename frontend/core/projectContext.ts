// core/projectContext.ts
import { SharedContext } from "./agentTypes";
import { createContext } from "./agentOrchestrator";

export type ProjectContext = SharedContext & {
  projectId: string;
  locale: string;
};

export function createProjectContext(
  projectId: string,
  locale = "fr",
  input: Partial<SharedContext> = {}
): ProjectContext {
  return { ...createContext({ ...input, projectId }), projectId, locale };
}
