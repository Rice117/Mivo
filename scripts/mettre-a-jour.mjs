// scripts/mettre-a-jour.mjs
// Met a jour un dossier Azuska Z DEJA installe, sans rien deplacer.
//
// Le geste naturel de Riche : elle telecharge le fichier de mise a jour, elle
// lance la mise a jour, et ca s'applique tout seul dans son dossier. Pas de
// nouveau dossier, pas de copie de plus a ranger.
//
// Ce que ce script garantit :
//  - le zip est verifie AVANT d'ecraser quoi que ce soit (les zips vides lui
//    ont deja fait perdre tout son travail) ;
//  - une sauvegarde automatique est faite avant chaque mise a jour, avec
//    10 copies tournantes ;
//  - son dossier mes-donnees/ et ses sauvegardes ne sont jamais touches ;
//  - le numero de version avant et apres est affiche, pour qu'elle voie
//    tout de suite si la mise a jour a pris.
//
// Aucune dependance : la lecture du zip est ecrite ici, en Node pur.

import {
  readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync,
  statSync, rmSync, cpSync,
} from "node:fs";
import { inflateRawSync } from "node:zlib";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NB_SAUVEGARDES = 10;

// Ce qui appartient a Riche et ne doit JAMAIS etre ecrase.
const INTOUCHABLE = ["mes-donnees", "sauvegardes-automatiques"];
// Ce qui ne sert a rien a copier (recree par l'installation).
const IGNORE = ["node_modules", ".next", ".test-build", ".git"];

function dire(m = "") { console.log(m); }
function erreur(m) { dire(""); dire("  " + m); dire(""); process.exit(1); }

// ---------------------------------------------------------------- lecture zip

function lireZip(chemin) {
  const buf = readFileSync(chemin);

  // Fin du repertoire central, cherchee depuis la fin du fichier.
  let fin = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66000); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { fin = i; break; }
  }
  if (fin < 0) throw new Error("ce fichier n'est pas un zip lisible");

  const nombre = buf.readUInt16LE(fin + 10);
  let position = buf.readUInt32LE(fin + 16);
  if (position === 0xffffffff) throw new Error("zip trop volumineux (format zip64)");

  const entrees = [];
  for (let i = 0; i < nombre; i++) {
    if (buf.readUInt32LE(position) !== 0x02014b50) throw new Error("repertoire du zip abime");
    const methode = buf.readUInt16LE(position + 10);
    const tailleCompressee = buf.readUInt32LE(position + 20);
    const tailleReelle = buf.readUInt32LE(position + 24);
    const lNom = buf.readUInt16LE(position + 28);
    const lExtra = buf.readUInt16LE(position + 30);
    const lComm = buf.readUInt16LE(position + 32);
    const debutLocal = buf.readUInt32LE(position + 42);
    const nom = buf.toString("utf8", position + 46, position + 46 + lNom);
    entrees.push({ nom, methode, tailleCompressee, tailleReelle, debutLocal });
    position += 46 + lNom + lExtra + lComm;
  }

  function contenu(entree) {
    if (buf.readUInt32LE(entree.debutLocal) !== 0x04034b50) {
      throw new Error(`entree abimee dans le zip : ${entree.nom}`);
    }
    const lNom = buf.readUInt16LE(entree.debutLocal + 26);
    const lExtra = buf.readUInt16LE(entree.debutLocal + 28);
    const debut = entree.debutLocal + 30 + lNom + lExtra;
    const brut = buf.subarray(debut, debut + entree.tailleCompressee);
    if (entree.methode === 0) return Buffer.from(brut);
    if (entree.methode === 8) return inflateRawSync(brut);
    throw new Error(`compression non geree dans le zip : ${entree.nom}`);
  }

  return { entrees, contenu };
}

// ------------------------------------------------------------ fichier a lire

function trouverZip() {
  const donne = process.argv[2];
  if (donne) {
    if (!existsSync(donne)) erreur(`Fichier introuvable : ${donne}`);
    return resolve(donne);
  }

  const candidats = [];
  for (const dossier of [join(homedir(), "Downloads"), join(homedir(), "Téléchargements"), RACINE]) {
    if (!existsSync(dossier)) continue;
    for (const nom of readdirSync(dossier)) {
      if (/^azuska.*\.zip$/i.test(nom)) {
        const complet = join(dossier, nom);
        candidats.push({ complet, date: statSync(complet).mtimeMs });
      }
    }
  }

  if (candidats.length === 0) {
    erreur(
      "Aucun fichier de mise a jour trouve.\n" +
      "  Telecharge le zip Azuska Z, laisse-le dans Telechargements,\n" +
      "  puis relance cette mise a jour."
    );
  }

  candidats.sort((a, b) => b.date - a.date);
  return candidats[0].complet;
}

function versionInstallee() {
  const chemin = join(RACINE, "frontend", "app", "version.ts");
  if (!existsSync(chemin)) return "inconnue";
  const trouve = readFileSync(chemin, "utf8").match(/VERSION\s*=\s*"([^"]+)"/);
  return trouve ? trouve[1] : "inconnue";
}

function versionDuZip(zip, prefixe) {
  const entree = zip.entrees.find((e) => e.nom === prefixe + "frontend/app/version.ts");
  if (!entree) return "inconnue";
  const trouve = zip.contenu(entree).toString("utf8").match(/VERSION\s*=\s*"([^"]+)"/);
  return trouve ? trouve[1] : "inconnue";
}

// ------------------------------------------------------------------ sauvegarde

function sauvegarder() {
  const dossier = join(RACINE, "sauvegardes-automatiques");
  mkdirSync(dossier, { recursive: true });

  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const nom = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}h${p(d.getMinutes())}`;
  const cible = join(dossier, nom);

  mkdirSync(cible, { recursive: true });
  for (const element of readdirSync(RACINE)) {
    if (INTOUCHABLE.includes(element) || IGNORE.includes(element)) continue;
    cpSync(join(RACINE, element), join(cible, element), {
      recursive: true,
      filter: (source) => !IGNORE.some((i) => source.includes(`${"/"}${i}`) || source.endsWith(i)),
    });
  }

  // On ne garde que les 10 sauvegardes les plus recentes.
  const toutes = readdirSync(dossier)
    .map((n) => ({ n, date: statSync(join(dossier, n)).mtimeMs }))
    .sort((a, b) => b.date - a.date);
  for (const vieille of toutes.slice(NB_SAUVEGARDES)) {
    rmSync(join(dossier, vieille.n), { recursive: true, force: true });
  }

  return { cible, gardees: Math.min(toutes.length, NB_SAUVEGARDES) };
}

// ------------------------------------------------------------------ programme

dire("");
dire("  Mise a jour d'Azuska Z");
dire("  ----------------------");
dire("");

const chemin = trouverZip();
dire(`  Fichier de mise a jour : ${chemin}`);

let zip;
try {
  zip = lireZip(chemin);
} catch (e) {
  erreur(`Ce fichier de mise a jour est abime (${e.message}).\n  Retelecharge-le, rien n'a ete modifie.`);
}

// Le zip contient un dossier unique en tete (Azuska-Z/). On le retire.
const premier = zip.entrees[0]?.nom ?? "";
const prefixe = premier.includes("/") ? premier.slice(0, premier.indexOf("/") + 1) : "";

// Verification AVANT toute ecriture : est-ce bien un projet Azuska Z complet ?
const obligatoires = [
  "frontend/package.json",
  "frontend/app/layout.tsx",
  "frontend/core/agentOrchestrator.ts",
];
const manquants = obligatoires.filter((f) => !zip.entrees.some((e) => e.nom === prefixe + f));
if (manquants.length > 0) {
  erreur(
    "Ce zip ne contient pas un projet Azuska Z complet.\n" +
    `  Il manque : ${manquants.join(", ")}\n` +
    "  Rien n'a ete modifie. Retelecharge le fichier."
  );
}

const avant = versionInstallee();
const apres = versionDuZip(zip, prefixe);
dire(`  Version installee : ${avant}`);
dire(`  Version du fichier : ${apres}`);

if (avant !== "inconnue" && avant === apres) {
  dire("");
  dire("  Tu as deja cette version. Rien a faire.");
  dire("");
  process.exit(0);
}

dire("");
dire("  Sauvegarde de la version actuelle...");
const { cible, gardees } = sauvegarder();
dire(`  Sauvegarde faite : sauvegardes-automatiques\\${cible.split(/[\\/]/).pop()}  (${gardees} conservees)`);

const paquetAvant = existsSync(join(RACINE, "frontend", "package.json"))
  ? readFileSync(join(RACINE, "frontend", "package.json"), "utf8")
  : "";

dire("  Installation des nouveaux fichiers...");
let ecrits = 0;
for (const entree of zip.entrees) {
  if (!entree.nom.startsWith(prefixe)) continue;
  const relatif = entree.nom.slice(prefixe.length);
  if (relatif === "" || relatif.endsWith("/")) continue;
  if (INTOUCHABLE.some((d) => relatif.startsWith(d + "/"))) continue;
  if (relatif.includes("..")) continue; // securite : jamais sortir du dossier

  const destination = join(RACINE, relatif);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, zip.contenu(entree));
  ecrits += 1;
}

const paquetApres = readFileSync(join(RACINE, "frontend", "package.json"), "utf8");
if (paquetAvant !== paquetApres) {
  writeFileSync(join(RACINE, "frontend", ".installation-requise"), "");
  dire("  Les composants ont change : ils seront reinstalles au prochain demarrage.");
}

dire("");
dire(`  Mise a jour terminee : ${ecrits} fichiers, version ${avant} -> ${apres}`);
dire("");
dire("  Double-clique maintenant sur DEMARRER.bat");
dire("");
