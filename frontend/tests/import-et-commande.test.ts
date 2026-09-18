// tests/import-et-commande.test.ts
// Lecture des fichiers réels (formats français et guinéens) et fonctionnement
// du Centre de commande, du plan jusqu'à l'exécution avec validation.

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { numericColumns, toNumber, guessProduct } from "../lib/parseTable";
import { createPlan, normalize, SENSITIVE_AGENTS } from "../core/agentPlanner";
import { createContext } from "../core/agentOrchestrator";
import { createExecution, executePlan, approveAndContinue, refuseStep } from "../core/executionEngine";

describe("Lecture des chiffres d'un fichier", () => {
  it("comprend les nombres écrits à la française et en francs guinéens", () => {
    assert.equal(toNumber("1 250 000"), 1250000);
    assert.equal(toNumber("1 250 000 GNF"), 1250000);
    assert.equal(toNumber("12,5"), 12.5);
    assert.equal(toNumber("1.250,50"), 1250.5);
    assert.equal(toNumber("1,250.50"), 1250.5);
    assert.equal(toNumber("1.250.000"), 1250000);
    assert.equal(toNumber("45,5 %"), 45.5);
    assert.equal(toNumber("(1 500)"), -1500); // négatif comptable
    assert.equal(toNumber("-300"), -300);
    assert.equal(toNumber(4200), 4200);
  });

  it("refuse ce qui n'est pas un nombre", () => {
    assert.equal(toNumber("écouteurs"), null);
    assert.equal(toNumber(""), null);
    assert.equal(toNumber("   "), null);
    assert.equal(toNumber(null), null);
    assert.equal(toNumber(undefined), null);
  });

  it("trouve la colonne de chiffres dans un vrai tableau de ventes", () => {
    const rows = [
      { Produit: "Savon", "Quantité vendue": "12", "Montant GNF": "1 250 000" },
      { Produit: "Savon", "Quantité vendue": "15", "Montant GNF": "1 500 000" },
      { Produit: "Savon", "Quantité vendue": "9", "Montant GNF": "900 000" },
    ];

    const columns = numericColumns(rows);
    const names = columns.map((c) => c.name);

    assert.ok(names.includes("Montant GNF"));
    assert.ok(names.includes("Quantité vendue"));
    assert.ok(!names.includes("Produit"));

    const montant = columns.find((c) => c.name === "Montant GNF");
    assert.deepEqual(montant?.values, [1250000, 1500000, 900000]);
  });

  it("devine le nom du produit depuis la première colonne de texte", () => {
    const rows = [{ Produit: "Savon", Montant: "1000" }];
    assert.equal(guessProduct(rows), "Savon");
  });

  it("ne retient pas une colonne presque vide", () => {
    const rows = [
      { Ventes: "10", Note: "bien" },
      { Ventes: "12", Note: "moyen" },
      { Ventes: "9", Note: "bien" },
    ];
    assert.deepEqual(
      numericColumns(rows).map((c) => c.name),
      ["Ventes"]
    );
  });
});

describe("Centre de commande — le plan", () => {
  it("ignore les accents et les majuscules", () => {
    assert.equal(normalize("PUBLICITÉ"), "publicite");
    const avec = createPlan("prépare une PUBLICITÉ");
    const sans = createPlan("prepare une publicite");
    assert.deepEqual(
      avec.steps.map((s) => s.agent),
      sans.steps.map((s) => s.agent)
    );
  });

  it("ajoute tout seul les étapes dont la demande dépend", () => {
    // « une campagne publicitaire » ne donnait qu'une étape, qui échouait
    // faute de stratégie marketing.
    const plan = createPlan("prépare une campagne publicitaire");
    assert.deepEqual(
      plan.steps.map((s) => s.agent),
      ["analysis", "marketing", "advertising"]
    );
    assert.equal(plan.steps[0].added, true);
    assert.equal(plan.steps[2].added, false);
  });

  it("met les étapes dans l'ordre de la chaîne, pas dans l'ordre des mots", () => {
    const plan = createPlan("je veux une campagne publicitaire puis une analyse des ventes");
    assert.deepEqual(
      plan.steps.map((s) => s.agent),
      ["analysis", "marketing", "advertising"]
    );
  });

  it("marque les étapes sensibles comme demandant une validation", () => {
    const plan = createPlan("prépare une campagne publicitaire");
    const pub = plan.steps.find((s) => s.agent === "advertising");
    assert.equal(pub?.requiresApproval, true);
    assert.ok(SENSITIVE_AGENTS.includes("developer"));
  });

  it("répond quelque chose d'utile quand rien n'est reconnu", () => {
    const plan = createPlan("bonjour");
    assert.equal(plan.steps.length, 1);
    assert.equal(plan.steps[0].agent, "welcome");
  });
});

describe("Centre de commande — l'exécution", () => {
  const VENTES = [100, 105, 102, 110, 140, 150, 160, 158];

  it("exécute réellement les agents et s'arrête avant l'action sensible", async () => {
    const plan = createPlan("analyse mes ventes et prépare une campagne publicitaire");
    const context = createContext({ values: VENTES, product: "savon" });
    const execution = await executePlan(createExecution(plan, context), plan);

    assert.equal(execution.status, "paused");
    assert.equal(execution.awaitingApproval?.agent, "advertising");

    // Les agents précédents, eux, ont bien travaillé.
    assert.equal(execution.results.length, 2);
    assert.equal(context.trend, "hausse");
    assert.ok(context.positioning);

    // Et la campagne n'existe pas encore : rien n'a été fait sans accord.
    assert.equal(
      execution.results.some((r) => r.agent === "advertising"),
      false
    );
  });

  it("reprend après validation et va jusqu'au bout", async () => {
    const plan = createPlan("analyse mes ventes et prépare une campagne publicitaire");
    const context = createContext({ values: VENTES, product: "savon" });
    const paused = await executePlan(createExecution(plan, context), plan);
    const finished = await approveAndContinue(paused, plan);

    assert.equal(finished.status, "completed");
    assert.equal(finished.results.length, 3);
    assert.equal(finished.results[2].result.status, "success");
  });

  it("garde le travail déjà fait quand la validation est refusée", async () => {
    const plan = createPlan("analyse mes ventes et prépare une campagne publicitaire");
    const context = createContext({ values: VENTES, product: "savon" });
    const paused = await executePlan(createExecution(plan, context), plan);
    const refused = refuseStep(paused);

    assert.equal(refused.status, "completed");
    assert.equal(refused.results.length, 2);
    assert.match(refused.errors.join(" "), /refus/i);
  });

  it("s'arrête avec un message clair quand il n'y a pas de chiffres", async () => {
    const plan = createPlan("analyse mes ventes");
    const context = createContext({ values: [], product: "savon" });
    const execution = await executePlan(createExecution(plan, context), plan);

    assert.equal(execution.status, "failed");
    assert.match(execution.errors.join(" "), /importe/i);
  });
});
