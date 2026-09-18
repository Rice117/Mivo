"use client";

import { AgentWorkspace } from "../workspace";

export default function AnalyticsPage() {
  return (
    <AgentWorkspace
      focus="analysis"
      title="Agent Analyse"
      intro="Tendance, valeurs inhabituelles et recommandations, calculées sur les chiffres que tu as importés."
    />
  );
}
