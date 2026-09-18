"use client";

// app/workspace.tsx
// L'espace de travail partagé par les pages Analyse, Marketing, Design et
// Publicité.
//
// Point essentiel : ces quatre pages ne rejouent PAS la chaîne chacune dans
// son coin. Elles appellent toutes runFullPipeline(), c'est-à-dire un seul
// moteur, un seul contexte partagé, sur les chiffres réellement importés.
// Chaque page se contente ensuite de mettre en avant l'agent qui la concerne,
// tout en montrant la conversation complète entre les agents.

import { useState } from "react";
import Link from "next/link";
import { AgentId, AgentResult } from "@/core/agentTypes";
import { PIPELINE_UP_TO, runFullPipeline } from "@/core/agentPipeline";
import { PipelineRun, agentName } from "@/core/agentOrchestrator";
import { datasetLabel } from "@/lib/storage";
import { useDataset } from "./useDataset";
import { AgentConversation, Alert, Button, Card, Chip, Field, Page } from "./ui";

const AGENT_NAMES: Record<string, string> = {
  welcome: "Agent Accueil",
  analysis: "Agent Analyse",
  marketing: "Agent Marketing",
  design: "Agent Design",
  advertising: "Agent Publicité",
  developer: "Agent Développeur",
};

export function AgentWorkspace({
  focus,
  title,
  intro,
}: {
  focus: AgentId;
  title: string;
  intro: string;
}) {
  const { dataset, loaded, useSample } = useDataset();
  const [product, setProduct] = useState("");
  const [objective, setObjective] = useState("");
  const [adObjective, setAdObjective] = useState("");
  const [run, setRun] = useState<PipelineRun | null>(null);

  const effectiveProduct = product || dataset?.product || "";

  function launch() {
    if (!dataset) return;
    setRun(
      runFullPipeline(
        {
          values: dataset.values,
          product: effectiveProduct,
          objective,
          adObjective,
          dataLabel: datasetLabel(dataset),
        },
        PIPELINE_UP_TO[focus]
      )
    );
  }

  const result = run?.results[focus];
  const failed = run && !run.ok;

  return (
    <Page title={title} intro={intro}>
      {loaded && !dataset && (
        <Alert>
          <p className="mb-3">
            Aucun chiffre n'est encore chargé. Les agents ne travaillent que sur tes vraies
            données — ils n'inventent rien.
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

      {dataset && (
        <div className="space-y-5">
          <Card>
            <p className="text-[13px] uppercase tracking-wide text-slate-500">Chiffres utilisés</p>
            <p className="mt-1 text-[15px] text-slate-200">{datasetLabel(dataset)}</p>
            <p className="mt-1 text-[13px] text-slate-500">
              {dataset.values.length} valeurs · <Link href="/import" className="text-amber-400 underline">changer</Link>
            </p>
          </Card>

          <div className="grid gap-4">
            <Field
              label="Produit concerné"
              value={effectiveProduct}
              onChange={setProduct}
              placeholder="ex : écouteurs sans fil"
            />
            <Field
              label="Objectif (facultatif)"
              value={objective}
              onChange={setObjective}
              placeholder="ex : augmenter les ventes avant les fêtes"
            />
            {focus === "advertising" && (
              <Field
                label="Objectif publicitaire (facultatif)"
                value={adObjective}
                onChange={setAdObjective}
                placeholder="ex : faire connaître la boutique"
              />
            )}
            <div>
              <Button onClick={launch} disabled={!effectiveProduct}>
                Faire travailler les agents
              </Button>
              {!effectiveProduct && (
                <p className="mt-2 text-[13px] text-slate-500">
                  Indique d'abord le produit concerné.
                </p>
              )}
            </div>
          </div>

          {failed && (
            <Alert tone="error">
              {Object.values(run.results)
                .filter((r): r is AgentResult => !!r && r.status === "echec")
                .map((r, i) => (
                  <p key={i}>
                    {agentName(r.agent)} : {String(r.raison ?? "raison inconnue")}
                  </p>
                ))}
            </Alert>
          )}

          {result && result.status === "success" && <AgentOutput focus={focus} result={result} />}

          {run && <AgentConversation messages={run.messages} names={AGENT_NAMES} />}
        </div>
      )}
    </Page>
  );
}

function AgentOutput({ focus, result }: { focus: AgentId; result: AgentResult }) {
  if (focus === "analysis") return <AnalysisOutput result={result} />;
  if (focus === "marketing") return <MarketingOutput result={result} />;
  if (focus === "design") return <DesignOutput result={result} />;
  if (focus === "advertising") return <AdvertisingOutput result={result} />;
  return null;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-[13px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-50">{value}</p>
    </Card>
  );
}

function AnalysisOutput({ result }: { result: AgentResult }) {
  const variation = result.variation_pourcent as number | null;
  const anomalies = (result.anomalies as { index: number; value: number }[]) ?? [];
  const recommendations = (result.recommandations as string[]) ?? [];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Tendance" value={String(result.tendance)} />
        <Stat
          label="Évolution"
          value={variation === null ? "—" : `${variation > 0 ? "+" : ""}${variation} %`}
        />
        <Stat label="Total" value={String(result.total)} />
      </div>
      <Card>
        <h2 className="mb-3 font-medium">Recommandations</h2>
        <ul className="list-inside list-disc space-y-2 text-[15px] leading-relaxed text-slate-200">
          {recommendations.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        {anomalies.length > 0 && (
          <p className="mt-4 text-[14px] text-slate-400">
            Valeurs inhabituelles : {anomalies.map((a) => `${a.value} (ligne ${a.index + 1})`).join(", ")}
          </p>
        )}
      </Card>
    </div>
  );
}

function MarketingOutput({ result }: { result: AgentResult }) {
  const canaux = (result.canaux as string[]) ?? [];
  return (
    <Card>
      <h2 className="mb-4 font-medium">Stratégie proposée</h2>
      <dl className="space-y-3 text-[15px] leading-relaxed">
        <div>
          <dt className="text-[13px] uppercase tracking-wide text-slate-500">Positionnement</dt>
          <dd className="text-slate-100">{String(result.positionnement)}</dd>
        </div>
        <div>
          <dt className="text-[13px] uppercase tracking-wide text-slate-500">Public cible</dt>
          <dd className="text-slate-100">{String(result.public_cible)}</dd>
        </div>
        <div>
          <dt className="text-[13px] uppercase tracking-wide text-slate-500">Priorité</dt>
          <dd className="text-slate-100">{String(result.priorite)}</dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        {canaux.map((c) => (
          <Chip key={c}>{c}</Chip>
        ))}
      </div>
    </Card>
  );
}

function DesignOutput({ result }: { result: AgentResult }) {
  const palette = (result.palette_couleurs as string[]) ?? [];
  const concepts = (result.concepts_visuels as string[]) ?? [];
  const formats = (result.formats_publications as string[]) ?? [];

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-medium">Palette de couleurs</h2>
        <p className="mt-1 text-[14px] leading-relaxed text-slate-400">
          {String(result.intention_palette)}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {palette.map((color) => (
            <div key={color} className="text-center">
              <div
                className="h-16 w-16 rounded-lg border border-slate-700"
                style={{ backgroundColor: color }}
              />
              <p className="mt-1 text-[12px] text-slate-400">{color}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-slate-500">
          Palette choisie d'après la priorité « {String(result.priorite_suivie)} » décidée par
          l'agent Marketing.
        </p>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Concepts visuels</h2>
        <ul className="list-inside list-disc space-y-2 text-[15px] leading-relaxed text-slate-200">
          {concepts.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="mb-3 font-medium">Formats à produire</h2>
        <div className="flex flex-wrap gap-2">
          {formats.map((f) => (
            <Chip key={f}>{f}</Chip>
          ))}
        </div>
      </Card>
    </div>
  );
}

function AdvertisingOutput({ result }: { result: AgentResult }) {
  const split = (result.repartition_budget_pourcent as Record<string, number>) ?? {};
  const entries = Object.entries(split);
  const max = Math.max(1, ...entries.map(([, v]) => v));

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-[13px] uppercase tracking-wide text-slate-500">Accroche</p>
        <p className="mt-1 text-xl font-medium leading-snug text-slate-50">
          {String(result.accroche)}
        </p>
        <p className="mt-3 text-[14px] text-slate-400">
          Objectif : {String(result.objectif_publicitaire)} · Public :{" "}
          {String(result.public_cible)}
        </p>
      </Card>

      <Card>
        <h2 className="mb-1 font-medium">Répartition du budget</h2>
        <p className="mb-4 text-[13px] text-slate-500">
          {/* L'addition de 33,4 + 33,3 + 33,3 donne 99,99999999999999 en
              virgule flottante : on arrondit pour afficher le vrai total. */}
          Total {Math.round(entries.reduce((sum, [, v]) => sum + v, 0) * 10) / 10} %
        </p>
        <ul className="space-y-3">
          {entries.map(([channel, percent]) => (
            <li key={channel}>
              <div className="mb-1 flex justify-between text-[14px]">
                <span className="text-slate-200">{channel}</span>
                <span className="text-slate-400">{percent} %</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${(percent / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
