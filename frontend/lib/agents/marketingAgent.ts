// lib/agents/marketingAgent.ts
// Agent Marketing : lit la tendance déposée par l'agent Analyse et décide la
// stratégie. Tout ce qu'il décide — positionnement, canaux, priorité, public
// cible — est déposé dans le contexte partagé, pour que Design et Publicité
// le LISENT au lieu de le redeviner.

import { Agent, AgentResult, Priority, SharedContext, Trend } from "../../core/agentTypes";
import { ChannelId, channelLabels } from "../../core/channels";

const CHANNELS_BY_TREND: Record<Trend, ChannelId[]> = {
  hausse: ["paid_ads", "social", "email"],
  baisse: ["targeted_promos", "customer_reactivation", "sms"],
  stable: ["organic_content", "loyalty_program"],
};

export const marketingAgent: Agent & {
  buildStrategy(
    objective: string,
    product: string,
    trend: Trend
  ): {
    positioning: string;
    channels: ChannelId[];
    priority: Priority;
    targetAudience: string;
  };
} = {
  buildStrategy(objective: string, product: string, trend: Trend) {
    const channels = CHANNELS_BY_TREND[trend] ?? CHANNELS_BY_TREND.stable;

    let positioning: string;
    let priority: Priority;

    if (trend === "hausse") {
      positioning = `Capitaliser sur la dynamique actuelle de ${product}.`;
      priority = "haute";
    } else if (trend === "baisse") {
      positioning = `Relancer l'intérêt pour ${product} avant que la baisse ne s'accentue.`;
      priority = "urgente";
    } else {
      positioning = `Consolider la présence de ${product} sur son marché.`;
      priority = "normale";
    }

    const targetAudience =
      trend === "hausse" ? "nouveaux clients et clients existants" : "clients existants";

    return { positioning, channels, priority, targetAudience };
  },

  run(context: SharedContext): AgentResult {
    // L'agent Marketing a besoin de la tendance. Sans elle, il refuse au lieu
    // de supposer « stable » et de produire une stratégie fausse.
    if (!context.trend) {
      return {
        agent: "marketing",
        status: "echec",
        raison: "tendance manquante : exécuter l'agent Analyse avant l'agent Marketing",
      };
    }

    const objective = context.objective ?? "développer les ventes";
    const product = context.product ?? "produit non précisé";

    const { positioning, channels, priority, targetAudience } = this.buildStrategy(
      objective,
      product,
      context.trend
    );

    // Dépôt complet dans le contexte partagé — priorité et public cible
    // compris, ce sont eux que l'agent Design lira.
    context.positioning = positioning;
    context.channels = channels;
    context.priority = priority;
    context.targetAudience = targetAudience;

    context.messages.push({
      agent: "marketing",
      content: `Stratégie (priorité ${priority}) : ${positioning} Canaux retenus : ${channelLabels(channels).join(", ")}.`,
    });

    return {
      agent: "marketing",
      status: "success",
      objectif: objective,
      positionnement: positioning,
      public_cible: targetAudience,
      canaux: channels,
      priorite: priority,
    };
  },
};
