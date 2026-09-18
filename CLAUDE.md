# Azuska Z — à lire avant de toucher au code

Ce fichier est lu automatiquement par toute session Claude Code qui ouvre ce
dépôt. Il existe parce que **plusieurs sessions travaillent sur ce projet**.
Lis-le en entier avant ta première modification, et mets-le à jour quand tu
changes quelque chose qui concerne les autres.

Riche n'a pas de formation informatique et travaille souvent depuis un iPad.
Explique en français simple, sans jargon, et ne déclare jamais un succès que tu
n'as pas exécuté toi-même.

---

## 1. Coordination entre sessions — lis ceci en premier

### Qui a fait quoi

| Date | Session | Travail |
|---|---|---|
| 18/09/2026 | branche `claude/claude-rc-j0u7hc` | Audit du zip, puis correction complète de `frontend/` : build réparé, iPhone, données importées branchées, agents réellement reliés, Centre de commande exécutant, 33 tests. Voir `CORRECTIONS-2026-09-18.md`. |

### Règles pour ne pas se marcher dessus

1. **Une session = une branche.** Ne pousse jamais sur la branche d'une autre
   session. Crée la tienne à partir de la branche la plus à jour, et dis-le
   dans le tableau ci-dessus (ajoute ta ligne, ne réécris pas les autres).
2. **Avant de commencer : `git fetch --all` et `git log --oneline -10`** sur
   toutes les branches. Le travail d'une autre session peut être plus récent que
   `main`.
3. **N'extrais jamais `azuska-z-complet.zip` par-dessus `frontend/`.** Ce zip
   est une archive figée du 12/08/2026. Le code de `frontend/` a un mois et
   demi d'avance sur lui. L'écraser détruirait tout le travail listé ci-dessus.
4. **Ne supprime rien sans demander.** Riche a déjà perdu une conversation
   entière et un dépôt de zips corrompus, et a dû tout recommencer de zéro.
   Livre toujours quelque chose de récupérable ; en cas de doute, garde et
   documente au lieu d'effacer.
5. **Mets à jour `CORRECTIONS-<date>.md`** (ou crée le tien) quand tu livres un
   lot. C'est ce que Riche relit.

### Attention : ce dépôt n'est peut-être pas la version la plus avancée

Ce dépôt contient la version reconstruite à partir du zip **du 12 août**.
D'après l'état du projet, une version de **septembre** existe ailleurs (sur
l'ordinateur de Riche) et contient en plus :

- la connexion réelle au cerveau IA (API Claude, branchée sur 4 agents) ;
- `core/permissions.ts` et `core/approval.ts` (gouvernance) ;
- `memory/persistentMemory.ts`, un stockage `data/store.json` ;
- 186+ tests, un dossier `controle-qualite/`, `scripts/fix-package-json.mjs`
  et `START-WINDOWS.bat`.

**Si tu retrouves cette version, ne la remplace pas par celle-ci.** Porte les
corrections d'ici vers là-bas, fichier par fichier. Demande à Riche avant.

---

## 2. Comment vérifier ton travail (obligatoire avant tout push)

```bash
cd frontend
npm install
npm run verifier   # types en mode strict — doit ne rien afficher
npm test           # 33 tests — doivent tous passer
npm run build      # la construction que lance Vercel — doit réussir
```

Les trois doivent passer. Un build cassé = plus rien ne se déploie, et Riche
voit une application morte sans comprendre pourquoi. C'est exactement ce qui
s'était produit : une seule ligne empêchait tout déploiement.

**Ne déclare jamais un succès sur la seule lecture du code.** Si tu ne peux pas
exécuter quelque chose, dis-le clairement plutôt que d'annoncer « c'est bon ».
Riche a demandé explicitement ce protocole (« zéro fausse validation »).

Un navigateur est disponible dans l'environnement cloud (Chromium
pré-installé, `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). Sers-t'en pour
vérifier réellement l'affichage au format iPhone plutôt que de supposer — c'est
comme ça que le total de budget affiché à `99.99999999999999 %` a été trouvé,
alors que les tests passaient.

---

## 3. Les règles d'architecture à ne pas casser

### a. Les agents ne communiquent QUE par le contexte partagé

C'est le cœur du projet : les agents doivent réellement se parler et ajuster
leurs réponses au travail des autres, pas alimenter un tableau de bord passif.

Si un agent a besoin d'une information, **celui qui l'a décidée doit la
déposer dans `SharedContext`** (`core/agentTypes.ts`). Un agent ne redevine
jamais la décision d'un autre. C'était le défaut principal : Marketing décidait
une priorité sans la déposer, Design la redevinait, et la palette « urgente »
n'était jamais utilisée.

### b. Aucune page n'appelle un agent directement

Tout passe par `runFullPipeline()` (`core/agentPipeline.ts`). Les pages
Analyse / Marketing / Design / Publicité sont de simples habillages de
`app/workspace.tsx`. Une page qui rejouerait la chaîne dans son coin casserait
précisément ce que la plateforme doit démontrer.

### c. Les canaux ont des identifiants stables

`core/channels.ts` : les agents s'échangent `"sms"`, jamais `"SMS"`. Le texte
français n'est qu'un affichage (`channelLabel()`). Ajouter un canal = l'ajouter
à `ChannelId`, à `CHANNEL_LABELS`, et à `FORMATS_BY_CHANNEL` dans
`designAgent.ts` — TypeScript te forcera la main, c'est voulu.

### d. Ajouter un agent

Déclare-le dans `AgentId` (`core/agentTypes.ts`), inscris-le dans
`AGENT_REGISTRY` (`lib/agents/index.ts`, typé `Record<AgentId, AgentEntry>` :
un oubli devient une erreur de compilation immédiate), et déclare ses
dépendances dans `AGENT_DEPENDENCIES`. L'architecture doit rester ouverte :
plus de sept agents sont prévus à terme.

### e. Validation avant action sensible

`core/executionEngine.ts` met l'exécution en pause avant les agents de
`SENSITIVE_AGENTS` (Publicité, Développeur) : **préparer → expliquer →
confirmer → agir**. Ne court-circuite jamais ce flux. L'agent Développeur
n'écrit rien sur le disque sans validation explicite.

### f. Pas de nouvelle dépendance npm sans raison forte

Riche a perdu des jours sur des blocages d'installation. Les 33 tests utilisent
`node:test`, livré avec Node — aucune bibliothèque de test installée. Pas de
bibliothèque de graphiques non plus : les visuels sont en CSS/SVG pur, et sans
animation « en direct » qui laisserait croire à un flux de données inexistant.

### g. Compatible iPhone dès le départ

Champs à 16 px (sinon Safari iOS agrandit la page à chaque focus), zones
tactiles à 44 px minimum, pas de débordement horizontal, marges d'encoche.
Utilise les composants de `app/ui.tsx` (`Page`, `Card`, `Field`, `Button`)
plutôt que de recopier des classes : la lisibilité s'applique alors partout
d'un coup.

---

## 4. Organisation du code

```
frontend/
  app/            écrans ; ui.tsx = briques communes ; workspace.tsx = espace partagé
  core/           types, canaux, orchestrateur, pipeline, planificateur, exécution
  lib/agents/     les 6 agents + le registre unique
  lib/            parseTable (lecture des nombres), dataImporter, storage, ids
  memory/         mémoire du projet et mémoire par agent
  database/       socle prêt pour Supabase — pas encore branché
  i18n/           6 langues écrites — pas encore utilisées par les écrans
  tests/          33 tests automatiques
backend/          ancienne API Python, plus utilisée — voir backend/LIRE-D-ABORD.md
captures-iphone/  preuves visuelles prises dans un vrai navigateur
```

---

## 5. Ce qui reste à faire (par ordre d'utilité)

1. **Brancher le cerveau IA.** C'est le manque le plus important : aujourd'hui
   les agents appliquent des règles de calcul, ils ne réfléchissent pas.
   Budget IA de Riche : 35-40 €/mois souhaités, **50 € maximum**. Toute
   proposition doit tenir dans cette enveloppe ou le dire clairement.
2. **Supabase** à la place de la mémoire qui repart de zéro à chaque
   rechargement.
3. **Les comptes** (connexion / inscription) — les écrans existent et
   annoncent honnêtement qu'ils ne sont pas branchés.
4. **`xlsx`** : seule alerte de sécurité restante, sans correctif sur npm.
   Chargée à la demande uniquement. À supprimer si Riche accepte de passer
   par des CSV.
5. **Les 6 langues** à brancher sur les écrans.
6. **Le tableau « flux de clients par heure/jour »** — dépend d'une connexion à
   KYLO magasin qui n'existe pas encore. Ne pas l'inventer.
7. **Commande vocale**, installation comme application sur téléphone.

Ne fusionne pas Azuska Z avec la boutique en ligne ni avec le magasin
physique : ce sont trois projets volontairement séparés tant que les
structures ne sont pas en place.
