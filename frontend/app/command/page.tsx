"use client";

// app/command/page.tsx
// Le Centre de commande exécute réellement.
//
// Avant : le plan s'affichait, « Accepter le plan » ne faisait rien, et aucun
// agent ne tournait. Maintenant le plan est complété de ses prérequis, les
// agents s'exécutent pour de vrai sur les chiffres importés, et l'exécution
// s'arrête AVANT toute action sensible pour te demander confirmation.

import { useState } from "react";
import Link from "next/link";
import { createPlan, ExecutionPlan } from "@/core/agentPlanner";
import { approveAndContinue, createExecution, executePlan, refuseStep } from "@/core/executionEngine";
import { Execution } from "@/core/execution";
import { createContext, agentName } from "@/core/agentOrchestrator";
import { datasetLabel } from "@/lib/storage";
import { AgentConversation, Alert, Button, Card, Page } from "../ui";
import { useDataset } from "../useDataset";

const AGENT_NAMES: Record<string, string> = {
  welcome: "Agent Accueil",
  analysis: "Agent Analyse",
  marketing: "Agent Marketing",
  design: "Agent Design",
  advertising: "Agent Publicité",
  developer: "Agent Développeur",
};

const EXAMPLES = [
  "analyse mes ventes du mois",
  "propose une campagne publicitaire",
  "prépare des publications pour les réseaux sociaux",
];

export default function CommandPage() {
  const { dataset, loaded, useSample } = useDataset();
  const [request, setRequest] = useState("");
  const [product, setProduct] = useState("");
  const [plan, setPlan] = useState<ExecutionPlan | null>(null);
  const [execution, setExecution] = useState<Execution | null>(null);
  const [busy, setBusy] = useState(false);

  const effectiveProduct = product || dataset?.product || "";

  function propose() {
    if (!request.trim()) return;
    setExecution(null);
    setPlan(createPlan(request, "fr"));
  }

  async function accept() {
    if (!plan || !dataset) return;
    setBusy(true);
    const context = createContext({
      values: dataset.values,
      product: effectiveProduct || undefined,
      objective: request,
      codeRequest: request,
      dataLabel: datasetLabel(dataset),
    });
    setExecution(await executePlan(createExecution(plan, context), plan));
    setBusy(false);
  }

  async function approve() {
    if (!plan || !execution) return;
    setBusy(true);
    setExecution(await approveAndContinue(execution, plan));
    setBusy(false);
  }

  function refuse() {
    if (!execution) return;
    setExecution(refuseStep(execution));
  }

  return (
    <Page
      title="Centre de commande"
      intro="Écris ta demande en français. La plateforme choisit les agents, te montre le plan, et ne lance rien avant que tu aies accepté."
    >
      <div className="space-y-5">
        {loaded && !dataset && (
          <Alert>
            <p className="mb-3">
              Il faut d'abord des chiffres : les agents travaillent sur tes données, pas sur des
              suppositions.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/import">
                <Button>Importer mes chiffres</Button>
              </Link>
              <Button variant="secondary" onClick={useSample}>
                Essayer avec un exemple
              </Button>
            </div>
          </Alert>
        )}

        <div>
          <label className="mb-1.5 block text-[15px] text-slate-300">Ta demande</label>
          <textarea
            value={request}
            onChange={(e) => setRequest(e.target.value)}
            placeholder="ex : analyse mes ventes du mois et propose une campagne publicitaire"
            rows={4}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 leading-relaxed text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => setRequest(example)}
                className="min-h-[40px] rounded-full border border-slate-700 px-4 text-[13px] text-slate-300 transition hover:border-amber-400 hover:text-amber-300"
              >
                {example}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <Button onClick={propose} disabled={!request.trim()}>
              Voir le plan
            </Button>
          </div>
        </div>

        {plan && (
          <Card>
            <h2 className="font-medium">Plan proposé</h2>
            <p className="mb-4 mt-1 text-[13px] text-slate-500">
              Les étapes grisées ont été ajoutées automatiquement : les agents suivants en ont
              besoin pour travailler.
            </p>
            <ol className="space-y-3">
              {plan.steps.map((step, index) => {
                const done = execution?.results.find((r) => r.agent === step.agent);
                return (
                  <li
                    key={index}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 last:border-0"
                  >
                    <span className="text-[15px]">
                      <span className="text-slate-100">{agentName(step.agent)}</span>
                      <span className={`ml-2 text-[13px] ${step.added ? "text-slate-500" : "text-slate-400"}`}>
                        {step.reason}
                      </span>
                    </span>
                    <span className="flex gap-2">
                      {step.requiresApproval && (
                        <span className="rounded-full bg-amber-400/20 px-3 py-1 text-[12px] text-amber-300">
                          validation requise
                        </span>
                      )}
                      {done && (
                        <span
                          className={`rounded-full px-3 py-1 text-[12px] ${
                            done.result.status === "success"
                              ? "bg-emerald-400/15 text-emerald-300"
                              : "bg-red-400/15 text-red-300"
                          }`}
                        >
                          {done.result.status === "success" ? "fait" : "échec"}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>

            {!execution && (
              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={accept} disabled={!dataset || busy}>
                  {busy ? "En cours…" : "Accepter et exécuter"}
                </Button>
                <Button variant="danger" onClick={() => setPlan(null)}>
                  Annuler
                </Button>
              </div>
            )}
          </Card>
        )}

        {execution?.awaitingApproval && (
          <Alert>
            <p className="mb-2 font-medium text-amber-200">
              Validation demandée : {agentName(execution.awaitingApproval.agent)}
            </p>
            <p className="mb-4 leading-relaxed">{execution.awaitingApproval.explanation}</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={approve} disabled={busy}>
                Je valide, continue
              </Button>
              <Button variant="danger" onClick={refuse}>
                Non, arrête ici
              </Button>
            </div>
          </Alert>
        )}

        {execution && execution.errors.length > 0 && (
          <Alert tone="error">
            {execution.errors.map((e, i) => (
              <p key={i}>{e}</p>
            ))}
          </Alert>
        )}

        {execution?.status === "completed" && !execution.awaitingApproval && (
          <Alert tone="success">
            Travail terminé — {execution.results.length} agent(s) ont travaillé à la suite.
          </Alert>
        )}

        {execution && <AgentConversation messages={execution.context.messages} names={AGENT_NAMES} />}
      </div>
    </Page>
  );
}
