// lib/parseTable.ts
// Lecture des chiffres d'un tableau importé — sans aucune dépendance, pour
// pouvoir être testé tout seul.
//
// Écrit pour de VRAIS fichiers français et guinéens : « 1 250 000 GNF »,
// « 1.250,50 », « 12 000 », « 45,5 % ». Un import qui refuse ces formats ne
// sert à rien ici.

export type TableRow = Record<string, unknown>;

export type NumericColumn = {
  name: string;
  values: number[];
  filled: number; // nombre de cellules réellement lisibles
  total: number; // nombre de lignes examinées
};

const SPACES = /[\s   ]/g;

// Convertit une cellule en nombre, ou null si ce n'en est pas un.
export function toNumber(cell: unknown): number | null {
  if (typeof cell === "number") return Number.isFinite(cell) ? cell : null;
  if (typeof cell !== "string") return null;

  let text = cell.trim();
  if (text === "") return null;

  // Négatif écrit entre parenthèses, comme en comptabilité : (1 500)
  let negative = false;
  if (/^\(.*\)$/.test(text)) {
    negative = true;
    text = text.slice(1, -1);
  }

  // On retire espaces, symboles monétaires et lettres d'unité (GNF, FCFA, €).
  text = text.replace(SPACES, "").replace(/[€$£%]/g, "").replace(/[A-Za-zÀ-ÿ]/g, "");
  if (text === "" || text === "-" || text === "+") return null;

  const hasComma = text.includes(",");
  const hasDot = text.includes(".");

  if (hasComma && hasDot) {
    // Le séparateur décimal est le dernier des deux : 1.250,50 ou 1,250.50
    const decimal = text.lastIndexOf(",") > text.lastIndexOf(".") ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    text = text.split(thousands).join("").replace(decimal, ".");
  } else if (hasComma) {
    // Virgule seule : décimale en français (12,5), sauf si elle sépare des
    // milliers par groupes de 3 (1,250,000).
    text = /^\d{1,3}(,\d{3})+$/.test(text) ? text.split(",").join("") : text.replace(",", ".");
  } else if (hasDot) {
    // Point seul : milliers si groupes de 3 répétés (1.250.000), sinon décimale.
    if (/^\d{1,3}(\.\d{3})+$/.test(text)) text = text.split(".").join("");
  }

  if (!/^[-+]?\d*\.?\d+$/.test(text)) return null;

  const value = Number(text);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

// Une colonne est retenue comme « chiffres » si au moins la moitié de ses
// cellules remplies sont des nombres — assez souple pour un fichier réel où
// quelques lignes sont vides ou mal saisies.
export function numericColumns(rows: TableRow[], minFilled = 2): NumericColumn[] {
  if (rows.length === 0) return [];

  const names = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const columns: NumericColumn[] = [];

  for (const name of names) {
    const values: number[] = [];
    let nonEmpty = 0;

    for (const row of rows) {
      const cell = row[name];
      if (cell === null || cell === undefined || cell === "") continue;
      nonEmpty += 1;
      const value = toNumber(cell);
      if (value !== null) values.push(value);
    }

    if (values.length >= minFilled && values.length >= nonEmpty / 2) {
      columns.push({ name, values, filled: values.length, total: rows.length });
    }
  }

  // La colonne la mieux remplie d'abord : c'est presque toujours celle qu'on veut.
  return columns.sort((a, b) => b.filled - a.filled);
}

// Devine le nom du produit à partir de la première colonne de texte.
export function guessProduct(rows: TableRow[]): string | undefined {
  if (rows.length === 0) return undefined;
  const names = Object.keys(rows[0]);
  for (const name of names) {
    const cell = rows[0][name];
    if (typeof cell === "string" && cell.trim() !== "" && toNumber(cell) === null) {
      return cell.trim();
    }
  }
  return undefined;
}
