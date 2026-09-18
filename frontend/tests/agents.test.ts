// tests/agents.test.ts
// Ces tests vérifient précisément les défauts qui avaient été trouvés dans le
// code : ils échoueraient si l'un d'eux revenait un jour.
//
// Aucun outil de test installé : on utilise celui qui est livré avec Node.

import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import { AgentId, SharedContext } from "../core/agentTypes";
import { CHANNEL_LABELS, ChannelId } from "../core/channels";
import { AGENT_REGISTRY, AGENT_IDS } from "../lib/agents";
import { createContext, runAgent, runPipeline, DEFAULT_PIPELINE } from "../core/agentOrchestrator";
import { analysisAgent, computeTrend, findAnomalies } from "../lib/agents/analysisAgent";
import { marketingAgent } from "../lib/agents/marketingAgent";
import { designAgent } from "../lib/agents/designAgent";
import { splitBudget } from "../lib/agents/advertisingAgent";
import { clearMemory, countMemory } from "../memory/projectMemory";

const HAUSSE = [100, 105, 102, 110, 140, 150, 160, 158];
const BAISSE = [200, 195, 190, 185, 120, 110, 100, 95];
const STABLE = [100, 101, 99, 100, 102, 98, 101, 100];

beforeEach(() => clearMemory());

describe("Registre des agents", () => {
  it("contient tous les agents déclarés — l'oubli qui cassait la construction", () => {
    const declared: AgentId[] = ["welcome", "analysis", "marketing", "advertising", "design", "developer"];
    for (const id of declared) {
      assert.ok(AGENT_REGISTRY[id], `l'agent ${id} manque dans le registre`);
      assert.equal(typeof AGENT_REGISTRY[id].agent.run, "function");
    }
    assert.equal(AGENT_IDS.length, declared.length);
  });
});

describe("Agent Analyse", () => {
  it("reconnaît une hausse, une baisse et une stabilité", () => {
    assert.equal(computeTrend(HAUSSE), "hausse");
    assert.equal(computeTrend(BAISSE), "baisse");
    assert.equal(computeTrend(STABLE), "stable");
  });

  it("ne signale rien quand toutes les valeurs sont identiques", () => {
    assert.deepEqual(findAnomalies([50, 50, 50, 50, 50]), []);
  });

  it("repère une valeur vraiment inhabituelle", () => {
    const anomalies = findAnomalies([100, 102, 98, 101, 99, 100, 300]);
    assert.equal(anomalies.length, 1);
    assert.equal(anomalies[0].value, 300);
  });

  it("refuse de travailler sans chiffres au lieu d'inventer", () => {
    const result = analysisAgent.run(createContext({ values: [] }));
    assert.equal(result.status, "echec");
  });
});

describe("Les agents se passent vraiment le relais", () => {
  it("Marketing lit la tendance déposée par Analyse", () => {
    const context = createContext({ values: BAISSE, product: "savon" });
    analysisAgent.run(context);
    assert.equal(context.trend, "baisse");

    marketingAgent.run(context);
    assert.equal(context.priority, "urgente");
    assert.match(String(context.positioning), /Relancer/);
  });

  it("Marketing dépose sa priorité et son public cible dans le contexte", () => {
    const context = createContext({ values: HAUSSE, product: "savon" });
    analysisAgent.run(context);
    marketingAgent.run(context);

    // C'est précisément ce qui manquait : Design devait redeviner la priorité.
    assert.equal(context.priority, "haute");
    assert.ok(context.targetAudience);
  });

  it("Design suit la priorité de Marketing — la palette « urgente » est bien utilisée", () => {
    const context = createContext({ values: BAISSE, product: "savon" });
    analysisAgent.run(context);
    marketingAgent.run(context);
    const result = designAgent.run(context);

    assert.equal(result.priorite_suivie, "urgente");
    assert.deepEqual(result.palette_couleurs, ["#E63946", "#1D3557", "#F1FAEE"]);
  });

  it("Marketing refuse de travailler sans l'analyse", () => {
    const result = marketingAgent.run(createContext({ product: "savon" }));
    assert.equal(result.status, "echec");
  });

  it("Design refuse de travailler sans la stratégie", () => {
    const result = designAgent.run(createContext({ product: "savon" }));
    assert.equal(result.status, "echec");
  });
});

describe("Noms de canaux", () => {
  it("chaque canal produit par Marketing a un format côté Design", () => {
    // C'est le bug silencieux : Marketing écrivait « SMS », Design cherchait
    // « sms », et le canal retombait sur un format générique sans rien dire.
    for (const trend of ["hausse", "baisse", "stable"] as const) {
      const context = createContext({ values: STABLE, product: "savon", trend });
      marketingAgent.run(context);
      const result = designAgent.run(context);
      const formats = result.formats_publications as string[];

      assert.ok(formats.length > 0, `aucun format pour la tendance ${trend}`);
      for (const channel of context.channels as ChannelId[]) {
        assert.ok(CHANNEL_LABELS[channel], `canal inconnu : ${channel}`);
      }
    }
  });
});

describe("Agent Publicité", () => {
  it("répartit exactement 100 % du budget", () => {
    for (const channels of [
      ["paid_ads", "social", "email"],
      ["targeted_promos", "customer_reactivation", "sms"],
      ["organic_content", "loyalty_program"],
      ["email"],
    ] as ChannelId[][]) {
      const split = splitBudget(channels);
      const total = Object.values(split).reduce((a, b) => a + b, 0);
      assert.equal(Math.round(total * 10) / 10, 100, `total ${total} pour ${channels.join(", ")}`);
    }
  });

  it("donne une part plus forte à la publicité payante quand la priorité est haute", () => {
    const split = splitBudget(["paid_ads", "social", "email"], ["paid_ads"]);
    assert.ok(split["publicité payante"] > split["réseaux sociaux"]);
    assert.equal(Object.values(split).reduce((a, b) => a + b, 0), 100);
  });

  it("ne renvoie rien quand il n'y a aucun canal", () => {
    assert.deepEqual(splitBudget([]), {});
  });
});

describe("Chaîne complète", () => {
  it("fait travailler les cinq agents sur un seul contexte partagé", () => {
    const run = runPipeline({ values: HAUSSE, product: "savon", objective: "vendre plus" });

    assert.equal(run.ok, true);
    assert.equal(run.order.length, DEFAULT_PIPELINE.length);
    assert.equal(run.results.advertising?.status, "success");

    // L'accroche de Publicité contient le positionnement de Marketing, qui
    // découle de la tendance d'Analyse : la chaîne est réellement enchaînée.
    assert.match(String(run.results.advertising?.accroche), /savon/);
    assert.equal(run.context.trend, "hausse");
    assert.ok(run.messages.length >= 5);
  });

  it("s'arrête net si un agent échoue, au lieu de continuer sur du vide", () => {
    const run = runPipeline({ values: [], product: "savon" });
    assert.equal(run.ok, false);
    assert.equal(run.results.marketing, undefined);
  });

  it("enregistre chaque exécution dans la mémoire du projet", () => {
    runPipeline({ values: HAUSSE, product: "savon" });
    assert.equal(countMemory(), DEFAULT_PIPELINE.length);
  });

  it("refuse un agent lancé trop tôt avec un message clair", () => {
    const context: SharedContext = createContext({ values: HAUSSE, product: "savon" });
    const result = runAgent("advertising", context);
    assert.equal(result.status, "echec");
    assert.match(String(result.raison), /Marketing/);
  });
});

describe("Affichage du budget", () => {
  it("l'addition affichée tombe juste à 100 %, sans traîne de décimales", () => {
    // 33,4 + 33,3 + 33,3 donne 99,99999999999999 en virgule flottante : c'est
    // exactement ce qui s'affichait à l'écran avant l'arrondi.
    const split = splitBudget(["targeted_promos", "customer_reactivation", "sms"]);
    const brut = Object.values(split).reduce((a, b) => a + b, 0);
    assert.notEqual(brut, 100, "le calcul brut n'est volontairement pas exact");
    assert.equal(Math.round(brut * 10) / 10, 100);
  });
});
