// lib/agents/analysisAgent.ts
// Agent Analyse : premier maillon de la chaîne. Il lit les chiffres réels
// importés par Riche et dépose dans le contexte partagé la tendance, les
// valeurs inhabituelles et ses recommandations — c'est ce que tous les
// agents suivants liront.

import { Agent, AgentResult, SharedContext, Trend } from "../../core/agentTypes";

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function computeTrend(values: number[]): Trend {
  if (values.length < 2) return "stable";
  const mid = Math.floor(values.length / 2);
  const avgFirst = mean(values.slice(0, mid));
  const avgSecond = mean(values.slice(mid));
  // Une moyenne de départ nulle ou négative rendrait la variation en
  // pourcentage trompeuse (une hausse s'afficherait en baisse).
  if (avgFirst <= 0) return avgSecond > avgFirst ? "hausse" : "stable";
  const variation = (avgSecond - avgFirst) / avgFirst;
  if (variation > 0.05) return "hausse";
  if (variation < -0.05) return "baisse";
  return "stable";
}

// Seuil volontairement à 1,8 écart-type et non 2 : sur des séries courtes
// (un mois de ventes, 10 à 30 valeurs), un seuil à 2 ne signale jamais rien.
const ANOMALY_THRESHOLD = 1.8;

export function findAnomalies(values: number[]): { index: number; value: number }[] {
  if (values.length < 4) return [];
  const avg = mean(values);
  const variance = mean(values.map((v) => (v - avg) ** 2));
  const stdev = Math.sqrt(variance);
  if (stdev === 0) return []; // toutes les valeurs sont identiques
  return values
    .map((value, index) => ({ index, value, z: (value - avg) / stdev }))
    .filter((v) => Math.abs(v.z) >= ANOMALY_THRESHOLD)
    .map(({ index, value }) => ({ index, value }));
}

function variationPercent(values: number[]): number | null {
  if (values.length < 2) return null;
  const mid = Math.floor(values.length / 2);
  const avgFirst = mean(values.slice(0, mid));
  if (avgFirst <= 0) return null;
  return Math.round(((mean(values.slice(mid)) - avgFirst) / avgFirst) * 1000) / 10;
}

export const analysisAgent: Agent & {
  analyze(values: number[]): {
    trend: Trend;
    anomalies: { index: number; value: number }[];
    recommendations: string[];
    variation: number | null;
    total: number;
    average: number;
  };
} = {
  analyze(values: number[]) {
    const trend = computeTrend(values);
    const anomalies = findAnomalies(values);
    const variation = variationPercent(values);
    const recommendations: string[] = [];

    if (trend === "hausse") recommendations.push("Renforcer le stock, la demande progresse.");
    else if (trend === "baisse") recommendations.push("Surveiller la baisse de demande.");
    else recommendations.push("Maintenir le niveau de stock actuel.");

    if (anomalies.length > 0) {
      recommendations.push(
        `${anomalies.length} valeur(s) inhabituelle(s) détectée(s) — vérifier s'il s'agit d'une erreur de saisie ou d'un vrai événement.`
      );
    }

    return {
      trend,
      anomalies,
      recommendations,
      variation,
      total: values.reduce((a, b) => a + b, 0),
      average: values.length > 0 ? mean(values) : 0,
    };
  },

  run(context: SharedContext): AgentResult {
    const values = context.values ?? [];
    if (values.length === 0) {
      context.messages.push({
        agent: "analysis",
        content: "Pas de chiffres à analyser. Importe d'abord un fichier depuis la page Importer.",
      });
      return { agent: "analysis", status: "echec", raison: "données insuffisantes" };
    }

    const { trend, anomalies, recommendations, variation, total, average } = this.analyze(values);

    // Dépôt dans le contexte partagé : c'est ici que les agents suivants liront.
    context.trend = trend;
    context.anomalies = anomalies;
    context.recommendations = recommendations;

    const source = context.dataLabel ? ` (${context.dataLabel})` : "";
    const chiffre = variation !== null ? ` (${variation > 0 ? "+" : ""}${variation} %)` : "";
    context.messages.push({
      agent: "analysis",
      content: `Tendance ${trend}${chiffre} sur ${values.length} valeurs${source}. ${recommendations.join(" ")}`,
    });

    return {
      agent: "analysis",
      status: "success",
      tendance: trend,
      variation_pourcent: variation,
      nombre_valeurs: values.length,
      total,
      moyenne: Math.round(average * 100) / 100,
      anomalies,
      recommandations: recommendations,
    };
  },
};
