// lib/agents/advertisingAgent.ts
// Agent Publicité : dernier maillon. Il lit le positionnement, les canaux et
// la priorité décidés par l'agent Marketing, et construit la campagne.
//
// La répartition du budget tient compte de la priorité : quand la priorité est
// haute ou urgente, la publicité payante reçoit une part double, parce que
// c'est le seul canal qui produit un effet immédiat.

import { Agent, AgentResult, SharedContext } from "../../core/agentTypes";
import { ChannelId, channelLabel, channelLabels } from "../../core/channels";

// Répartit 100 % entre les canaux, en donnant le reste au canal le mieux doté
// pour que le total fasse exactement 100 % (et non 99,9 %).
export function splitBudget(
  channels: ChannelId[],
  boosted: ChannelId[] = []
): Record<string, number> {
  if (channels.length === 0) return {};

  const weights: number[] = channels.map((c) => (boosted.includes(c) ? 2 : 1));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  // On travaille en dixièmes de pour cent (1000 = 100 %) pour éviter les
  // arrondis flottants, puis on donne le reste au canal le plus lourd.
  const tenths = weights.map((w) => Math.floor((w / totalWeight) * 1000));
  let remainder = 1000 - tenths.reduce((a, b) => a + b, 0);
  let i = weights.indexOf(Math.max(...weights));
  while (remainder > 0) {
    tenths[i] += 1;
    remainder -= 1;
    i = (i + 1) % tenths.length;
  }

  const split: Record<string, number> = {};
  channels.forEach((c, index) => {
    split[channelLabel(c)] = tenths[index] / 10;
  });
  return split;
}

export const advertisingAgent: Agent = {
  run(context: SharedContext): AgentResult {
    const product = context.product ?? "produit non précisé";
    const positioning = context.positioning;
    const channels = context.channels ?? [];
    const adObjective = context.adObjective ?? "générer des ventes";

    if (!positioning) {
      context.messages.push({
        agent: "advertising",
        content: "En attente du positionnement marketing.",
      });
      return {
        agent: "advertising",
        status: "echec",
        raison: "positionnement marketing manquant : exécuter l'agent Marketing d'abord",
      };
    }

    const headline = `${product} : ${positioning.replace(/\.$/, "")}.`;
    const urgent = context.priority === "haute" || context.priority === "urgente";
    const budgetSplit = splitBudget(channels, urgent ? ["paid_ads"] : []);

    context.headline = headline;
    context.budgetSplit = budgetSplit;

    context.messages.push({
      agent: "advertising",
      content: `Campagne créée : « ${headline} » diffusée sur ${
        channelLabels(channels).join(", ") || "aucun canal défini"
      }.`,
    });

    return {
      agent: "advertising",
      status: "success",
      objectif_publicitaire: adObjective,
      accroche: headline,
      public_cible: context.targetAudience ?? "clients existants",
      repartition_budget_pourcent: budgetSplit,
      canaux: channelLabels(channels),
    };
  },
};
