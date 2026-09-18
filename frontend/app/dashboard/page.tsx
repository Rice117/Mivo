"use client";

import Link from "next/link";
import { listAgents } from "@/lib/agents";
import { AgentId } from "@/core/agentTypes";
import { datasetLabel } from "@/lib/storage";
import { Button, Card, Page } from "../ui";
import { useDataset } from "../useDataset";

const AGENT_LINKS: Record<AgentId, string> = {
  welcome: "/",
  analysis: "/analytics",
  marketing: "/marketing",
  design: "/design",
  advertising: "/advertising",
  developer: "/command",
};

export default function DashboardPage() {
  const agents = listAgents();
  const { dataset, loaded } = useDataset();

  return (
    <Page title="Tableau de bord" intro="Tes agents et l'état de tes données.">
      <div className="space-y-5">
        <Card>
          <p className="text-[13px] uppercase tracking-wide text-slate-500">Données</p>
          {loaded && dataset ? (
            <p className="mt-1 text-[15px] text-slate-200">
              {datasetLabel(dataset)} — {dataset.values.length} valeurs
            </p>
          ) : (
            <div className="mt-1">
              <p className="text-[15px] text-slate-300">Aucun chiffre chargé.</p>
              <div className="mt-4">
                <Link href="/import">
                  <Button>Importer mes chiffres</Button>
                </Link>
              </div>
            </div>
          )}
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          {agents.map((agent) => (
            <Link
              key={agent.id}
              href={AGENT_LINKS[agent.id] ?? "/agents"}
              className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-amber-400"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[12px] uppercase tracking-wide text-amber-400">Actif</span>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </div>
              <h2 className="font-medium">{agent.nom}</h2>
              <p className="mt-1 text-[14px] leading-relaxed text-slate-400">{agent.role}</p>
            </Link>
          ))}
        </div>
      </div>
    </Page>
  );
}
