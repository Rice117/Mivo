"use client";

import { useEffect, useState } from "react";
import { Dataset, SAMPLE_DATASET, loadDataset, saveDataset } from "@/lib/storage";

// Charge les chiffres réellement importés par Riche. Le chargement se fait
// après l'affichage (et non pendant le rendu) parce que le stockage du
// navigateur n'existe pas côté serveur.
export function useDataset() {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setDataset(loadDataset());
    setLoaded(true);
  }, []);

  function useSample() {
    const sample = { ...SAMPLE_DATASET, importedAt: new Date().toISOString() };
    saveDataset(sample);
    setDataset(sample);
  }

  return { dataset, loaded, useSample, setDataset };
}
