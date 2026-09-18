// database/store.ts
// Magasin en mémoire avec CRUD par projectId.
// Même limite que projectMemory/agentMemory : pas encore persistant.
// À remplacer par des appels Supabase (voir TODO plus bas) sans changer
// la signature de ces fonctions, pour que les pages n'aient rien à changer.

import {
  User,
  Project,
  DataSource,
  Analysis,
  MarketingStrategy,
  AdvertisingCampaign,
} from "../core/projectStructure";

const users: User[] = [];
const projects: Project[] = [];
const dataSources: DataSource[] = [];
const analyses: Analysis[] = [];
const strategies: MarketingStrategy[] = [];
const campaigns: AdvertisingCampaign[] = [];

export const store = {
  addUser(u: User) {
    users.push(u);
    return u;
  },
  addProject(p: Project) {
    projects.push(p);
    return p;
  },
  addDataSource(d: DataSource) {
    dataSources.push(d);
    return d;
  },
  addAnalysis(a: Analysis) {
    analyses.push(a);
    return a;
  },
  addStrategy(s: MarketingStrategy) {
    strategies.push(s);
    return s;
  },
  addCampaign(c: AdvertisingCampaign) {
    campaigns.push(c);
    return c;
  },

  getProject(projectId: string) {
    return projects.find((p) => p.id === projectId);
  },
  getDataSourcesByProject(projectId: string) {
    return dataSources.filter((d) => d.projectId === projectId);
  },
  getAnalysesByProject(projectId: string) {
    return analyses.filter((a) => a.projectId === projectId);
  },
  getStrategiesByProject(projectId: string) {
    return strategies.filter((s) => s.projectId === projectId);
  },
  getCampaignsByProject(projectId: string) {
    return campaigns.filter((c) => c.projectId === projectId);
  },
};

// TODO (prochaine étape) : remplacer chaque tableau en RAM ci-dessus par
// des tables Supabase (users, projects, data_sources, analyses,
// marketing_strategies, advertising_campaigns) et ces fonctions par des
// appels supabase.from("...").select()/insert().
