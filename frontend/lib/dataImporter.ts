// lib/dataImporter.ts
// Lit un fichier CSV, Excel ou JSON et le transforme en lignes exploitables.
// La détection des colonnes de chiffres vit dans lib/parseTable.ts (testable
// séparément, sans dépendance).

import Papa from "papaparse";
import { NumericColumn, TableRow, guessProduct, numericColumns } from "./parseTable";

export type ImportedFile = {
  fileName: string;
  rows: TableRow[];
  columns: NumericColumn[];
  suggestedProduct?: string;
};

export class ImportError extends Error {}

export async function readFile(file: File): Promise<ImportedFile> {
  const extension = file.name.split(".").pop()?.toLowerCase();
  let rows: TableRow[];

  if (extension === "csv" || extension === "txt") {
    const text = await file.text();
    // skipEmptyLines évite une dernière ligne vide qui fausserait les calculs.
    const parsed = Papa.parse<TableRow>(text, { header: true, skipEmptyLines: true });
    rows = parsed.data ?? [];
  } else if (extension === "xlsx" || extension === "xls") {
    // La bibliothèque Excel pèse à elle seule plus de 120 Ko. Elle n'est
    // chargée QUE si un fichier Excel est réellement choisi : la page reste
    // légère pour tous les autres cas, ce qui compte sur un téléphone.
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) throw new ImportError("Ce fichier Excel ne contient aucune feuille.");
    rows = XLSX.utils.sheet_to_json<TableRow>(firstSheet);
  } else if (extension === "json") {
    const text = await file.text();
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new ImportError("Ce fichier JSON est mal formé et n'a pas pu être lu.");
    }
    if (Array.isArray(parsed)) {
      rows = parsed.map((item) =>
        typeof item === "object" && item !== null ? (item as TableRow) : { valeur: item }
      );
    } else if (parsed && typeof parsed === "object") {
      rows = [parsed as TableRow];
    } else {
      rows = [];
    }
  } else {
    throw new ImportError("Format non pris en charge. Utilise un fichier CSV, Excel (.xlsx) ou JSON.");
  }

  if (rows.length === 0) {
    throw new ImportError("Ce fichier ne contient aucune ligne de données.");
  }

  const columns = numericColumns(rows);
  if (columns.length === 0) {
    throw new ImportError(
      "Aucune colonne de chiffres trouvée. Vérifie que la première ligne contient bien les titres des colonnes."
    );
  }

  return {
    fileName: file.name,
    rows,
    columns,
    suggestedProduct: guessProduct(rows),
  };
}
