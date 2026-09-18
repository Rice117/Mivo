"use client";

import Link from "next/link";
import { listAgents } from "@/lib/agents";
import { AGENT_DEPENDENCIES, AgentId } from "@/core/agentTypes";
import { agentName } from "@/core/agentOrchestrator";
import { Card, Page } from "../ui";

const AGENT_LINKS: Record<AgentId, string> = {
  welcome: "/",
  analysis: "/analytics",
  marketing: "/marketing",
  design: "/design",
  advertising: "/advertising",
  developer: "/command",
};

export default function AgentsPage() {
  const agents = listAgents();

  return (
    <Page
      title="Les agents"
      intro="Chaque agent est spécialisé, et la plupart ont besoin du travail d'un autre pour faire le leur."
    >
      <div className="space-y-4">
        {agents.map((agent) => {
          const deps = AGENT_DEPENDENCIES[agent.id];
          return (
            <Card key={agent.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-medium">{agent.nom}</h2>
                  <p className="mt-1 text-[14px] leading-relaxed text-slate-400">{agent.role}</p>
                  <p className="mt-2 text-[13px] text-slate-500">
                    {deps.length === 0
                      ? "Travaille sans rien attendre d'un autre agent."
                      : `A besoin de : ${deps.map(agentName).join(", ")}.`}
                  </p>
                </div>
                <Link
                  href={AGENT_LINKS[agent.id] ?? "/"}
                  className="flex min-h-[44px] shrink-0 items-center rounded-lg border border-slate-700 px-4 text-[15px] transition hover:border-amber-400"
                >
                  Ouvrir
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
