"use client";

// app/import/page.tsx
// L'import est le point de départ de toute la plateforme : c'est ici que les
// chiffres réels entrent. Auparavant, le fichier était affiché puis oublié —
// les agents continuaient à travailler sur un exemple écrit dans le code.
// Désormais le fichier est conservé, et c'est lui que tous les agents lisent.

import { useCallback, useState } from "react";
import Link from "next/link";
import { ImportError, ImportedFile, readFile } from "@/lib/dataImporter";
import { NumericColumn } from "@/lib/parseTable";
import { saveDataset } from "@/lib/storage";
import { Alert, Button, Card, Field, Page } from "../ui";
import { useDataset } from "../useDataset";

export default function ImportPage() {
  const { dataset, useSample, setDataset } = useDataset();
  const [file, setFile] = useState<ImportedFile | null>(null);
  const [column, setColumn] = useState<NumericColumn | null>(null);
  const [product, setProduct] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleFile = useCallback(async (selected: File) => {
    setError("");
    setSaved(false);
    try {
      const imported = await readFile(selected);
      setFile(imported);
      setColumn(imported.columns[0]);
      setProduct(imported.suggestedProduct ?? "");
    } catch (err) {
      setFile(null);
      setColumn(null);
      setError(
        err instanceof ImportError
          ? err.message
          : "Impossible de lire ce fichier. Vérifie son format."
      );
    }
  }, []);

  function confirm() {
    if (!file || !column) return;
    const next = {
      fileName: file.fileName,
      column: column.name,
      values: column.values,
      product: product.trim() || undefined,
      importedAt: new Date().toISOString(),
    };
    saveDataset(next);
    setDataset(next);
    setSaved(true);
  }

  return (
    <Page
      title="Importer mes chiffres"
      intro="CSV, Excel ou JSON. Les chiffres importés sont ceux que tous les agents utiliseront ensuite."
    >
      <div className="space-y-5">
        {dataset && !saved && (
          <Alert>
            Chiffres actuellement utilisés : <strong>{dataset.fileName}</strong> — colonne «{" "}
            {dataset.column} » ({dataset.values.length} valeurs). Importer un nouveau fichier les
            remplacera.
          </Alert>
        )}

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) handleFile(dropped);
          }}
          className={`flex min-h-[160px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-5 py-10 text-center transition ${
            dragOver ? "border-amber-400 bg-slate-900" : "border-slate-700"
          }`}
        >
          <span className="text-[15px] text-slate-200">
            Touche ici pour choisir un fichier
          </span>
          <span className="text-[13px] text-slate-500">
            ou glisse-le depuis ton ordinateur · .csv · .xlsx · .json
          </span>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json,.txt"
            className="hidden"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (selected) handleFile(selected);
            }}
          />
        </label>

        {error && <Alert tone="error">{error}</Alert>}

        {file && column && (
          <Card>
            <h2 className="font-medium">{file.fileName}</h2>
            <p className="mt-1 text-[14px] text-slate-400">
              {file.rows.length} lignes lues · {file.columns.length} colonne(s) de chiffres trouvée(s)
            </p>

            <p className="mb-2 mt-5 text-[15px] text-slate-300">Quelle colonne analyser ?</p>
            <div className="flex flex-col gap-2">
              {file.columns.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColumn(c)}
                  className={`min-h-[48px] rounded-lg border px-4 text-left text-[15px] transition ${
                    column.name === c.name
                      ? "border-amber-400 bg-amber-400/10 text-amber-200"
                      : "border-slate-700 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {c.name}
                  <span className="ml-2 text-[13px] text-slate-500">{c.filled} valeurs</span>
                </button>
              ))}
            </div>

            <div className="mt-5">
              <Field
                label="Produit concerné (facultatif)"
                value={product}
                onChange={setProduct}
                placeholder="ex : écouteurs sans fil"
              />
            </div>

            <p className="mt-4 text-[13px] text-slate-500">
              Aperçu : {column.values.slice(0, 8).join(" · ")}
              {column.values.length > 8 ? " …" : ""}
            </p>

            <div className="mt-5">
              <Button onClick={confirm}>Utiliser ces chiffres</Button>
            </div>
          </Card>
        )}

        {saved && (
          <Alert tone="success">
            <p className="mb-3">Chiffres enregistrés. Les agents travailleront maintenant dessus.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/analytics">
                <Button>Lancer l'analyse</Button>
              </Link>
              <Link href="/command">
                <Button variant="secondary">Aller au Centre de commande</Button>
              </Link>
            </div>
          </Alert>
        )}

        {!file && !dataset && (
          <p className="text-[14px] text-slate-500">
            Pas de fichier sous la main ?{" "}
            <button onClick={useSample} className="text-amber-400 underline">
              Essayer avec un exemple
            </button>
            .
          </p>
        )}
      </div>
    </Page>
  );
}
