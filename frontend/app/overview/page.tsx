"use client";

// app/overview/page.tsx
// Vue d'ensemble honnête : elle affiche ce qui s'est réellement passé depuis
// l'ouverture de l'application, et le dit clairement plutôt que de laisser
// croire à un historique conservé.

import { useEffect, useState } from "react";
import { listAgents } from "@/lib/agents";
import { agentName } from "@/core/agentOrchestrator";
import { MemoryItem, allMemory } from "@/memory/projectMemory";
import { datasetLabel } from "@/lib/storage";
import { Card, Page } from "../ui";
import { useDataset } from "../useDataset";

export default function OverviewPage() {
  const agents = listAgents();
  const { dataset } = useDataset();
  const [memory, setMemory] = useState<MemoryItem[]>([]);

  useEffect(() => {
    setMemory(allMemory());
  }, []);

  return (
    <Page
      title="Vue d'ensemble"
      intro="Ce que les agents ont produit depuis que tu as ouvert l'application."
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-[13px] uppercase tracking-wide text-slate-500">Agents</p>
            <p className="mt-1 text-2xl font-semibold">{agents.length}</p>
          </Card>
          <Card>
            <p className="text-[13px] uppercase tracking-wide text-slate-500">Exécutions</p>
            <p className="mt-1 text-2xl font-semibold">{memory.length}</p>
          </Card>
          <Card>
            <p className="text-[13px] uppercase tracking-wide text-slate-500">Valeurs chargées</p>
            <p className="mt-1 text-2xl font-semibold">{dataset?.values.length ?? 0}</p>
          </Card>
        </div>

        {dataset && (
          <Card>
            <p className="text-[13px] uppercase tracking-wide text-slate-500">Source des chiffres</p>
            <p className="mt-1 text-[15px] text-slate-200">{datasetLabel(dataset)}</p>
          </Card>
        )}

        <Card>
          <h2 className="mb-1 font-medium">Journal des agents</h2>
          <p className="mb-4 text-[13px] text-slate-500">
            Ce journal repart de zéro à chaque rechargement de la page : la mémoire durable
            (Supabase) reste à brancher. C'est volontairement dit ici, pour ne pas laisser croire
            à un historique conservé.
          </p>
          {memory.length === 0 ? (
            <p className="text-[15px] text-slate-400">
              Aucun agent n'a encore travaillé pendant cette visite.
            </p>
          ) : (
            <ol className="space-y-2">
              {memory.map((item) => (
                <li key={item.id} className="border-b border-slate-800 pb-2 text-[15px] last:border-0">
                  <span className="text-amber-400">
                    {item.agent ? agentName(item.agent) : "Système"}
                  </span>{" "}
                  <span className="text-slate-300">{item.content}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </Page>
  );
}
