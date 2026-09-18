// lib/storage.ts
// Conserve le fichier importé pour que TOUTES les pages travaillent dessus.
//
// Avant, importer un fichier n'avait aucun effet : les agents continuaient à
// analyser une liste de chiffres d'exemple écrite en dur dans le code. C'est
// la raison principale pour laquelle la plateforme semblait ne rien apporter.
//
// Le stockage passe par le navigateur (localStorage). Sur iPhone en navigation
// privée, cet accès peut lever une erreur : tout est donc entouré d'un
// try/catch, et l'application continue de fonctionner sans planter.

const KEY = "azuska.dataset.v1";

export type Dataset = {
  fileName: string;
  column: string;
  values: number[];
  product?: string;
  importedAt: string;
};

export const SAMPLE_DATASET: Dataset = {
  fileName: "exemple",
  column: "ventes (exemple)",
  values: [120, 135, 128, 142, 150, 149, 161, 158, 172, 180],
  product: "écouteurs sans fil",
  importedAt: "",
};

// Copie de secours en mémoire quand le navigateur refuse le stockage.
let fallback: Dataset | null = null;

export function saveDataset(dataset: Dataset): void {
  fallback = dataset;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(dataset));
  } catch {
    // Navigation privée ou stockage plein : on garde la copie en mémoire.
  }
}

export function loadDataset(): Dataset | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Dataset;
      if (Array.isArray(parsed?.values) && parsed.values.length > 0) return parsed;
    }
  } catch {
    // On retombe sur la copie en mémoire.
  }
  return fallback;
}

export function clearDataset(): void {
  fallback = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // rien à faire
  }
}

export function datasetLabel(dataset: Dataset): string {
  return dataset.fileName === "exemple"
    ? "chiffres d'exemple"
    : `${dataset.fileName} — colonne « ${dataset.column} »`;
}
