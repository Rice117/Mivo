// core/projectStructure.ts
// Utilisateur -> Projet -> Données importées, Agents IA, Mémoires,
// Analyses, Stratégies marketing, Campagnes publicitaires.

export interface User {
  id: string;
  nom?: string;
  email: string;
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  nom: string;
  createdAt: string;
}

export interface DataSource {
  id: string;
  projectId: string;
  nomFichier: string;
  type: "csv" | "excel" | "json";
  importedAt: string;
}

export interface Analysis {
  id: string;
  projectId: string;
  produit: string;
  tendance: "hausse" | "baisse" | "stable";
  createdAt: string;
}

export interface MarketingStrategy {
  id: string;
  projectId: string;
  analysisId: string;
  positionnement: string;
  canaux: string[];
  createdAt: string;
}

export interface AdvertisingCampaign {
  id: string;
  projectId: string;
  strategyId: string;
  accroche: string;
  createdAt: string;
}

export interface ProjectOverview {
  project: Project;
  nbAgents: number;
  nbMemoires: number;
  nbAnalyses: number;
  nbStrategies: number;
  nbCampagnes: number;
}
