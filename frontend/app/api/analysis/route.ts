// app/api/analysis/route.ts
// Point d'entrée API : permet de lancer la chaîne d'agents depuis l'extérieur
// (un autre outil, un script, plus tard la boutique ou le magasin).

import { NextRequest, NextResponse } from "next/server";
import { runFullPipeline } from "@/core/agentPipeline";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { status: "echec", raison: "corps de requête illisible : envoie du JSON" },
      { status: 400 }
    );
  }

  const values = Array.isArray(body.values) ? body.values.filter((v) => typeof v === "number") : [];

  if (values.length === 0) {
    return NextResponse.json(
      { status: "echec", raison: "aucun chiffre fourni dans « values »" },
      { status: 400 }
    );
  }

  const run = runFullPipeline({
    values: values as number[],
    product: typeof body.product === "string" ? body.product : undefined,
    objective: typeof body.objective === "string" ? body.objective : undefined,
    projectId: typeof body.projectId === "string" ? body.projectId : "default",
  });

  return NextResponse.json({
    ok: run.ok,
    resultats: run.results,
    conversation: run.messages,
  });
}
