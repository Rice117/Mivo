"use client";

import { AgentWorkspace } from "../workspace";

export default function MarketingPage() {
  return (
    <AgentWorkspace
      focus="marketing"
      title="Agent Marketing"
      intro="La stratégie est construite à partir de la tendance que l'agent Analyse vient de calculer — pas d'une règle fixe."
    />
  );
}
