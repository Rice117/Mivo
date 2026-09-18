// lib/agents/designAgent.ts
// Agent Design : conçoit la direction visuelle à partir de ce que l'agent
// Marketing a réellement décidé.
//
// Avant, cet agent redevinait la priorité en regardant si « publicité payante »
// figurait dans les canaux — si bien que la palette « urgente » (celle prévue
// quand les ventes baissent) n'était jamais utilisée. Il lit désormais
// context.priority, déposée par l'agent Marketing lui-même.

import { Agent, AgentResult, Priority, SharedContext } from "../../core/agentTypes";
import { ChannelId, channelLabels } from "../../core/channels";

const PALETTES: Record<Priority, string[]> = {
  urgente: ["#E63946", "#1D3557", "#F1FAEE"], // contrastée, incite à l'action
  haute: ["#2A9D8F", "#264653", "#E9C46A"], // dynamique, confiance
  normale: ["#457B9D", "#A8DADC", "#F1FAEE"], // apaisée, cohérente
};

const PALETTE_INTENT: Record<Priority, string> = {
  urgente: "Couleurs contrastées : il faut réagir vite, le message doit arrêter le regard.",
  haute: "Couleurs dynamiques et rassurantes : la demande progresse, on installe la confiance.",
  normale: "Couleurs apaisées : on consolide une présence, sans crier.",
};

// Un format par canal — les clés sont les identifiants officiels de
// core/channels.ts, plus aucun risque de « SMS » contre « sms ».
const FORMATS_BY_CHANNEL: Record<ChannelId, string[]> = {
  paid_ads: ["bannière 1200x628", "publication carrée 1080x1080"],
  social: ["publication carrée 1080x1080", "story 1080x1920", "carrousel 5 slides"],
  email: ["bannière email 600x300"],
  sms: ["visuel miniature pour lien SMS"],
  targeted_promos: ["visuel promo avec prix barré", "story compte à rebours"],
  customer_reactivation: ["visuel « vous nous avez manqué »", "bannière email 600x300"],
  organic_content: ["publication carrée 1080x1080", "reel/vidéo courte"],
  loyalty_program: ["carte de fidélité illustrée", "publication carrée 1080x1080"],
};

export const designAgent: Agent & {
  buildConcepts(
    product: string,
    positioning: string,
    channels: ChannelId[],
    priority: Priority
  ): { visualConcepts: string[]; postFormats: string[]; palette: string[]; paletteIntent: string };
} = {
  buildConcepts(product: string, positioning: string, channels: ChannelId[], priority: Priority) {
    const visualConcepts = [
      `Visuel héro mettant en avant ${product}, aligné sur le message : « ${positioning} »`,
      `Déclinaison « avant/après » ou « témoignage client » pour renforcer la confiance`,
      `Série de 3 à 5 posts courts déclinant le même univers graphique, pour la cohérence de marque`,
    ];

    if (priority === "urgente") {
      visualConcepts.push(
        `Visuel d'urgence : offre limitée dans le temps, compte à rebours bien lisible`
      );
    }

    const postFormats = Array.from(new Set(channels.flatMap((c) => FORMATS_BY_CHANNEL[c] ?? [])));

    return {
      visualConcepts,
      postFormats,
      palette: PALETTES[priority],
      paletteIntent: PALETTE_INTENT[priority],
    };
  },

  run(context: SharedContext): AgentResult {
    if (!context.positioning || !context.priority) {
      return {
        agent: "design",
        status: "echec",
        raison: "positionnement manquant : exécuter l'agent Marketing avant l'agent Design",
      };
    }

    const product = context.product ?? "le produit";
    const channels = context.channels ?? [];
    const { visualConcepts, postFormats, palette, paletteIntent } = this.buildConcepts(
      product,
      context.positioning,
      channels,
      context.priority
    );

    context.visualConcepts = visualConcepts;
    context.colorPalette = palette;
    context.postFormats = postFormats;

    context.messages.push({
      agent: "design",
      content: `Direction visuelle pour ${product}, priorité ${context.priority} : ${postFormats.join(", ")}.`,
    });

    return {
      agent: "design",
      status: "success",
      priorite_suivie: context.priority,
      concepts_visuels: visualConcepts,
      palette_couleurs: palette,
      intention_palette: paletteIntent,
      formats_publications: postFormats,
      canaux: channelLabels(channels),
    };
  },
};
