// core/channels.ts
// Liste unique et officielle des canaux de diffusion.
//
// Pourquoi ce fichier existe : l'agent Marketing écrivait « SMS » pendant que
// l'agent Design cherchait « sms », et personne ne s'en apercevait — le canal
// retombait silencieusement sur un format générique. Désormais les agents
// s'échangent un identifiant stable (jamais du texte affiché), et le libellé
// français n'est utilisé que pour l'affichage.

export type ChannelId =
  | "paid_ads"
  | "social"
  | "email"
  | "sms"
  | "targeted_promos"
  | "customer_reactivation"
  | "organic_content"
  | "loyalty_program";

export const CHANNEL_LABELS: Record<ChannelId, string> = {
  paid_ads: "publicité payante",
  social: "réseaux sociaux",
  email: "email",
  sms: "SMS",
  targeted_promos: "promotions ciblées",
  customer_reactivation: "réactivation clients",
  organic_content: "contenu organique",
  loyalty_program: "programme de fidélité",
};

export function channelLabel(id: ChannelId): string {
  return CHANNEL_LABELS[id] ?? id;
}

export function channelLabels(ids: ChannelId[]): string[] {
  return ids.map(channelLabel);
}
