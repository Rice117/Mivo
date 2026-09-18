# Azuska Z

Plateforme d'agents IA : tes chiffres entrent, et les agents se passent le
relais — Analyse → Marketing → Design → Publicité — chacun travaillant à partir
de ce que le précédent a réellement produit.

## Démarrer

```bash
cd frontend
npm install
npm run dev        # puis ouvrir http://localhost:3000
```

## Vérifier que tout va bien

```bash
cd frontend
npm run verifier   # contrôle des types (doit ne rien afficher)
npm test           # 33 tests automatiques
npm run build      # construction de production (celle que Vercel lance)
```

Ces trois commandes doivent passer **avant** tout envoi sur GitHub. C'est ce
qui évite qu'un déploiement échoue sans qu'on comprenne pourquoi.

## Comment ça s'utilise

1. **Importer** un fichier de ventes (CSV, Excel ou JSON). L'application
   repère les colonnes de chiffres, tu choisis laquelle analyser.
2. Les pages **Analyse**, **Marketing**, **Design** et **Publicité** travaillent
   toutes sur ces chiffres-là.
3. Le **Centre de commande** accepte une phrase en français, propose un plan,
   complète tout seul les étapes manquantes, puis exécute — en s'arrêtant pour
   te demander confirmation avant toute action sensible.

## Comment c'est organisé

```
frontend/
  app/            les écrans (+ ui.tsx : les briques communes, pensées pour l'iPhone)
  core/           le moteur : types, canaux, orchestrateur, planificateur, exécution
  lib/agents/     les 6 agents + le registre unique
  lib/            lecture des fichiers importés, stockage, identifiants
  memory/         la mémoire du projet et celle de chaque agent
  database/       socle prêt pour Supabase (pas encore branché)
  i18n/           6 langues écrites, pas encore utilisées par les écrans
  tests/          les tests automatiques
backend/          ancienne architecture Python — voir backend/LIRE-D-ABORD.md
```

## Les deux règles à ne pas casser

1. **Les agents ne se parlent qu'à travers le contexte partagé.** Si un agent a
   besoin d'une information, celui qui l'a décidée doit la déposer dans
   `SharedContext` — jamais la redeviner de son côté.
2. **Aucune page n'appelle un agent directement.** Tout passe par
   `runFullPipeline()`. C'est ce qui garantit que ce qui s'affiche est bien le
   fruit du travail enchaîné des agents.

## Ce qui n'est pas encore fait

- Le cerveau IA n'est pas branché dans cette version : les agents appliquent
  des règles de calcul, ils ne « réfléchissent » pas encore.
- La mémoire repart de zéro à chaque rechargement (Supabase reste à brancher).
- Les comptes (connexion / inscription) ne sont pas branchés.
- Les 6 langues sont écrites mais pas encore utilisées par les écrans.
