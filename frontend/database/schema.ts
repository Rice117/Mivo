// database/schema.ts
// Fonctions de création avec id/dates auto pour chaque entité.
// Prêtes à être branchées sur Supabase (Postgres) à la place de la RAM.

import {
  User,
  Project,
  DataSource,
  Analysis,
  MarketingStrategy,
  AdvertisingCampaign,
} from "../core/projectStructure";
import { newId, nowISO as now } from "../lib/ids";

export function createUser(data: { email: string; nom?: string }): User {
  return { id: newId("user"), createdAt: now(), ...data };
}

export function createProject(data: { userId: string; nom: string }): Project {
  return { id: newId("proj"), createdAt: now(), ...data };
}

export function createDataSource(data: {
  projectId: string;
  nomFichier: string;
  type: DataSource["type"];
}): DataSource {
  return { id: newId("data"), importedAt: now(), ...data };
}

export function createAnalysis(data: {
  projectId: string;
  produit: string;
  tendance: Analysis["tendance"];
}): Analysis {
  return { id: newId("analysis"), createdAt: now(), ...data };
}

export function createMarketingStrategy(data: {
  projectId: string;
  analysisId: string;
  positionnement: string;
  canaux: string[];
}): MarketingStrategy {
  return { id: newId("strategy"), createdAt: now(), ...data };
}

export function createAdvertisingCampaign(data: {
  projectId: string;
  strategyId: string;
  accroche: string;
}): AdvertisingCampaign {
  return { id: newId("campaign"), createdAt: now(), ...data };
}
