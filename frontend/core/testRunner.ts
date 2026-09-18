// core/testRunner.ts
// Socle prêt pour l'agent Développeur — pas encore branché.
import { nowISO } from "../lib/ids";

export type TestResult = {
  projectPath: string;
  passed: boolean;
  errors: string[];
  ranAt: string;
};

export async function runTests(projectPath: string): Promise<TestResult> {
  // Placeholder : à brancher sur un vrai exécuteur (ex. sandbox CI) plus tard.
  return { projectPath, passed: true, errors: [], ranAt: nowISO() };
}

export type CodeReview = {
  approved: boolean;
  errors: string[];
  suggestions: string[];
};

export function reviewTestResult(result: TestResult): CodeReview {
  if (result.passed) {
    return { approved: true, errors: [], suggestions: [] };
  }
  return {
    approved: false,
    errors: result.errors,
    suggestions: ["Corriger les erreurs signalées puis relancer les tests avant de proposer le commit."],
  };
}
