// scripts/reparer-package-json.mjs
// Auto-reparation avant tout demarrage.
//
// Riche a perdu des jours sur des blocages d'installation : versions
// invalides, fichier enregistre en UTF-16, marque d'octets invisible en tete
// de fichier. Ce script repare ces cas tout seul, au lieu de laisser npm
// afficher une erreur incomprehensible.
//
// Il est volontairement sans aucune dependance et ne casse jamais le
// demarrage : en cas de doute, il previent et laisse le fichier tel quel.

import { readFileSync, writeFileSync, existsSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const racine = join(dirname(fileURLToPath(import.meta.url)), "..", "frontend");
const chemin = join(racine, "package.json");

function dire(message) {
  console.log(`  [reparation] ${message}`);
}

if (!existsSync(chemin)) {
  dire("package.json introuvable dans frontend/ — rien a reparer.");
  process.exit(0);
}

const octets = readFileSync(chemin);
let texte;
let modifie = false;

// 1. Fichier enregistre en UTF-16 (un octet nul sur deux) : on reconvertit.
if (octets.length > 1 && (octets[0] === 0xff || octets[0] === 0xfe)) {
  texte = octets.toString("utf16le").replace(/^﻿/, "");
  modifie = true;
  dire("fichier reconverti depuis UTF-16 vers UTF-8.");
} else {
  texte = octets.toString("utf8");
}

// 2. Marque d'octets invisible en tete de fichier : npm refuse de lire.
if (texte.charCodeAt(0) === 0xfeff) {
  texte = texte.slice(1);
  modifie = true;
  dire("marque invisible en tete de fichier retiree.");
}

let paquet;
try {
  paquet = JSON.parse(texte);
} catch (erreur) {
  console.log("");
  console.log("  Le fichier frontend/package.json est abime et ne peut pas etre lu.");
  console.log("  Detail : " + erreur.message);
  console.log("  Recupere une copie propre du projet avant de continuer.");
  console.log("");
  process.exit(1);
}

// 3. Versions invalides (un numero colle, une virgule en trop, un guillemet
//    typographique) : on les remet a une valeur connue qui fonctionne.
const VERSIONS_SURES = {
  next: "^16.3.5",
  react: "^19.0.0",
  "react-dom": "^19.0.0",
  papaparse: "^5.4.1",
  xlsx: "^0.18.5",
};

const valide = /^(\^|~|>=|<=|>|<)?\d+\.\d+\.\d+([-+].*)?$|^\*$|^latest$/;

for (const [nom, sure] of Object.entries(VERSIONS_SURES)) {
  const actuelle = paquet.dependencies?.[nom];
  if (actuelle && !valide.test(String(actuelle).trim())) {
    paquet.dependencies[nom] = sure;
    modifie = true;
    dire(`version invalide corrigee pour ${nom} : "${actuelle}" -> "${sure}".`);
  }
}

// 4. Scripts indispensables au demarrage.
paquet.scripts = paquet.scripts ?? {};
for (const [nom, commande] of Object.entries({ dev: "next dev", build: "next build", start: "next start" })) {
  if (!paquet.scripts[nom]) {
    paquet.scripts[nom] = commande;
    modifie = true;
    dire(`script manquant ajoute : ${nom}.`);
  }
}

if (modifie) {
  copyFileSync(chemin, chemin + ".avant-reparation");
  writeFileSync(chemin, JSON.stringify(paquet, null, 2) + "\n", "utf8");
  dire("package.json repare (ancienne version gardee en .avant-reparation).");
} else {
  dire("package.json en bon etat.");
}
