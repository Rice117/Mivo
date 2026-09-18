"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createContext, runAgent } from "@/core/agentOrchestrator";
import { datasetLabel } from "@/lib/storage";
import { Button, Card, Page } from "./ui";
import { useDataset } from "./useDataset";

export default function HomePage() {
  const { dataset, loaded } = useDataset();
  const [greeting, setGreeting] = useState("");

  // L'agent Accueil est lancé une seule fois, à l'ouverture. Auparavant il
  // était relancé à chaque lettre tapée dans le champ prénom, et chaque
  // exécution s'ajoutait à la mémoire du projet — le compteur de « mémoires »
  // comptait donc des frappes clavier.
  useEffect(() => {
    const context = createContext({});
    const result = runAgent("welcome", context);
    setGreeting(String(result.greeting ?? ""));
  }, []);

  return (
    <Page
      title={greeting || "Bienvenue sur Azuska Z"}
      intro="Tes agents analysent tes chiffres, en déduisent une stratégie, une direction visuelle et une campagne — chacun reprenant le travail du précédent."
    >
      <div className="space-y-5">
        <Card>
          <p className="text-[13px] uppercase tracking-wide text-slate-500">Où en es-tu</p>
          {loaded && dataset ? (
            <>
              <p className="mt-1 text-[15px] text-slate-200">
                Chiffres chargés : {datasetLabel(dataset)} ({dataset.values.length} valeurs).
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/command">
                  <Button>Ouvrir le Centre de commande</Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="secondary">Voir l'analyse</Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-[15px] leading-relaxed text-slate-300">
                Aucun chiffre n'est encore chargé. Commence par importer un fichier de ventes :
                c'est lui que les agents liront.
              </p>
              <div className="mt-4">
                <Link href="/import">
                  <Button>Importer mes chiffres</Button>
                </Link>
              </div>
            </>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-medium">Comment ça marche</h2>
          <ol className="space-y-2 text-[15px] leading-relaxed text-slate-300">
            <li>
              <span className="text-amber-400">1.</span> Tu importes tes chiffres de ventes.
            </li>
            <li>
              <span className="text-amber-400">2.</span> L'agent Analyse en tire une tendance.
            </li>
            <li>
              <span className="text-amber-400">3.</span> L'agent Marketing en déduit une stratégie
              et une priorité.
            </li>
            <li>
              <span className="text-amber-400">4.</span> L'agent Design choisit les couleurs et les
              formats selon cette priorité.
            </li>
            <li>
              <span className="text-amber-400">5.</span> L'agent Publicité écrit l'accroche et
              répartit le budget — après ta validation.
            </li>
          </ol>
        </Card>
      </div>
    </Page>
  );
}
