# Audit du code `azuska-z-complet.zip`

Dépôt : `rice117/mivo` · Branche : `claude/claude-rc-j0u7hc` · Date : 18/09/2026

Audit en lecture seule : **aucun fichier du projet n'a été modifié**. Le zip a été
extrait dans un dossier de travail temporaire, en dehors du dépôt.

---

## 1. Ce qui a été réellement vérifié (et ce qui ne l'a pas été)

Protocole « zéro fausse validation » — ce que j'affirme ci-dessous, je l'ai exécuté.

**Vérifié réellement :**

| Vérification | Résultat |
|---|---|
| Le zip s'extrait sans erreur | ✅ 60 fichiers, 340 Ko, aucune corruption |
| `npm install` | ✅ a fonctionné dans cet environnement (le réseau n'était pas bloqué cette fois) |
| `npx tsc --noEmit` (strict) | ❌ **1 erreur** |
| `npx next build` | ❌ **échoue** sur cette même erreur |
| `npx next build` après correction de cette seule ligne | ✅ **passe**, 14 routes construites, `strict: true` conservé |
| `npm audit` | ❌ 3 vulnérabilités : 1 critique, 2 hautes |
| `npm run lint` | ⚠️ pose une question interactive (ESLint non configuré) et reste bloqué |

**Pas vérifiable ici, donc non affirmé :**

- Aucun navigateur disponible → **le rendu visuel, le responsive iPhone/iPad et les
  clics réels n'ont pas été testés**. Rien de ce qui suit ne dit que l'affichage est bon.
- Aucun test automatisé dans ce zip (0 fichier de test) → rien à exécuter de ce côté.
- Aucune clé réelle (IA, Supabase, paiement) → aucune intégration externe testée.

---

## 2. Le point le plus important : ce zip est une version du 12 août

Les fichiers sont datés des **11 et 12 août 2026**. Depuis, d'après l'état du projet,
au moins un mois de travail a été fait — et **rien de tout cela n'est dans ce zip** :

| Présent dans le projet actuel | Présent dans ce zip ? |
|---|---|
| Connexion réelle au cerveau IA (API Claude, 15/08) | ❌ absent — aucun appel IA nulle part |
| Cerveau branché sur les 4 agents de la chaîne (02/09) | ❌ absent |
| `core/permissions.ts` (qui a le droit de quoi) | ❌ absent |
| `core/approval.ts` (validation avant action sensible) | ❌ absent |
| `memory/persistentMemory.ts` | ❌ absent |
| Les 186+ tests automatisés | ❌ absent |
| Dossier `controle-qualite/` | ❌ absent |
| `scripts/fix-package-json.mjs` + `START-WINDOWS.bat` | ❌ absent |
| Panneau « Vue d'ensemble » du 02/09 sur `/dashboard` | ❌ absent |
| Stockage JSON `data/store.json` | ❌ absent (tout est en RAM ici) |

**Conséquence concrète : ne jamais extraire ce zip par-dessus le projet actuel.**
Ce serait un retour en arrière d'un mois, et la gouvernance (permissions + validation
avant action) disparaîtrait. Ce zip est une archive de secours, pas une version à jour.

Point rassurant, vu l'historique des zips vides : **celui-ci est sain et complet pour
sa date**. Il s'extrait, il se compile (après la correction ci-dessous), rien n'est
tronqué.

---

## 3. Bloquant : le build échoue — 1 seule erreur

```
core/agentOrchestrator.ts:32
Element implicitly has an 'any' type because expression of type 'AgentId'
can't be used to index type '{ welcome; analysis; marketing; design; advertising }'.
Property 'developer' does not exist on type ...
```

**La cause :** `AgentId` (dans `core/agentTypes.ts`) liste **6** agents, dont
`developer`. Mais `AGENT_REGISTRY` (dans `lib/agents/index.ts`) n'en contient que **5** :
l'agent Développeur n'y a jamais été inscrit. TypeScript refuse donc la ligne
`AGENT_REGISTRY[agentId]`.

**Ce que ça veut dire en pratique :** sur Vercel, `npm run build` échoue et **le
déploiement ne passe pas**. Le README du zip annonce « l'ensemble compile
logiquement » — ce n'était pas vrai, et personne ne l'avait exécuté.

**Vérifié :** en corrigeant cette seule ligne, `next build` passe entièrement, les
14 routes se construisent, et `strict: true` reste actif. C'est donc le seul blocage
de compilation.

Deux façons de corriger, selon l'intention :

- **Rapide** — typer l'accès au registre (l'agent Développeur reste absent) ;
- **Correcte** — inscrire réellement `developer` dans `AGENT_REGISTRY`. Mais il faut
  d'abord lui donner la même forme que les autres : aujourd'hui `developerAgent`
  expose `generateCode(task)` (asynchrone), pas `run(context)`. Les deux interfaces
  sont incompatibles.

---

## 4. Sécurité des dépendances

`npm audit` : **1 critique, 2 hautes**.

| Paquet | Gravité | Correctif |
|---|---|---|
| `next` 14.2.5 | 🔴 critique (exécution de code à distance, contournement d'autorisation, empoisonnement de cache) | passer à **14.2.35** — simple correctif de la même série 14.2, sans changement cassant |
| `postcss` | 🟠 haute | corrigé par la même montée de `next` |
| `xlsx` 0.18.5 | 🟠 haute (pollution de prototype, ReDoS) | **aucun correctif sur npm** — SheetJS ne publie plus sur npm |

Sur `xlsx` : il n'est utilisé qu'à un seul endroit, la page `/import`, pour lire les
fichiers Excel. Il pèse à lui seul l'essentiel des **205 Ko** de cette page (contre
~90 Ko pour les autres) — c'est la page la plus lourde à charger sur un téléphone en
Guinée. Trois options possibles, à décider plus tard : le garder en connaissance de
cause, l'installer depuis le CDN officiel de SheetJS, ou demander des fichiers CSV
plutôt qu'Excel et le retirer.

---

## 5. L'exigence centrale : est-ce que les agents se parlent vraiment ?

C'est le cœur du projet. Réponse honnête : **oui dans le moteur, non dans l'écran**.

**Ce qui tient réellement** — le contexte partagé fonctionne. Dans
`runPipeline()` (`core/agentOrchestrator.ts`) et `runFullPipeline()`
(`core/agentPipeline.ts`), les agents se passent vraiment le relais : Analyse dépose
`trend`, Marketing le lit et dépose `positioning` + `channels`, Design et Publicité
les lisent. Et les garde-fous sont bons : lancer Publicité sans Marketing renvoie un
échec explicite (« exécuter l'agent marketing d'abord ») au lieu d'inventer une
campagne dans le vide. Ça, c'est réussi.

**Ce qui ne tient pas :**

1. **Les pages contournent le moteur.** `/analytics`, `/marketing` et `/design`
   n'utilisent ni `runPipeline` ni `runFullPipeline`. Chaque page rejoue la chaîne
   dans son coin en appelant `analysisAgent.analyze(...)` puis
   `marketingAgent.buildStrategy(...)` à la main, sur **la même liste de chiffres
   d'exemple recopiée en dur dans 3 fichiers** (`SAMPLE_VALUES = [120, 135, ...]`).
   Chaque écran repart donc de zéro : rien de ce qui a été fait sur un écran n'est vu
   par le suivant. Seule `/advertising` passe par le vrai `runPipeline`.
   `runFullPipeline()` — la chaîne complète des 4 agents, Design compris — **n'est
   appelée nulle part**.

2. **Marketing perd la moitié de ce qu'il décide.** `marketingAgent.run()` calcule
   `priority` (« urgente » quand les ventes baissent) et `targetAudience`, les renvoie
   dans son résultat… mais ne les dépose **pas** dans le contexte partagé — ces deux
   champs n'existent même pas dans `SharedContext`. Design, qui ne peut donc pas les
   lire, **re-devine** la priorité à sa façon : « y a-t-il de la publicité payante
   dans les canaux ? ». Résultat mesurable : la palette `urgente` (rouge, celle prévue
   pour une baisse des ventes) **n'est jamais utilisée**, dans aucun cas de figure.
   C'est exactement le symptôme que tu veux éviter : un agent qui redevine au lieu de lire.

3. **Les noms de canaux ne correspondent pas d'un agent à l'autre.** Marketing produit
   `"SMS"`, `"réactivation clients"`, `"programme de fidélité"` ; le tableau
   `FORMATS_BY_CHANNEL` de Design connaît `"sms"` (en minuscules) et ignore les deux
   autres. Ces canaux retombent donc silencieusement sur un format générique. En clair :
   quand les ventes baissent, Design propose des formats à côté de la stratégie — sans
   qu'aucune erreur ne s'affiche.

4. **`/design` n'affiche pas la palette.** La page appelle `designAgent.buildConcepts()`
   directement au lieu de `run()` — or la palette de couleurs n'est calculée que dans
   `run()`. Elle n'apparaît donc jamais à l'écran.

---

## 6. Le Centre de commande affiche un plan, mais rien ne s'exécute

- Le bouton **« Accepter le plan »** n'a aucun `onClick` : il ne fait rien. Idem pour
  **« Modifier »**. Seul « Annuler » fonctionne.
- `core/executionEngine.ts` (`executePlan`) **n'est importé nulle part**. Et même s'il
  l'était : il n'appelle aucun agent — il se contente d'empiler
  `{ agent, reason }` dans un tableau de résultats. La pause aux étapes sensibles est
  donc écrite, mais elle ne met en pause rien du tout, puisque rien ne tourne.
- `agentPlanner.createPlan()` **n'ajoute pas les étapes prérequises**. Une demande
  comme « prépare une campagne publicitaire » ne produit qu'une seule étape,
  `advertising` — qui échouerait faute de positionnement marketing. Le planificateur
  devrait compléter la chaîne (Analyse → Marketing → Design → Publicité) dès qu'une
  étape plus loin est demandée.
- Le mot-clé `developer` peut être routé par le planificateur, alors que cet agent
  n'existe pas dans le registre : la réponse serait « type d'agent inconnu ».

Autrement dit, `/command` est aujourd'hui une **maquette du plan**, pas un centre de
commande. C'est cohérent avec le principe « préparer → expliquer → faire valider »,
mais l'étape « faire » manque encore.

---

## 7. Code écrit mais jamais utilisé

Ces fichiers compilent, mais **aucune page ne les appelle**. Ils donnent l'impression
que la plateforme fait plus qu'elle ne fait réellement :

| Fichier / dossier | Utilisé ? |
|---|---|
| `database/store.ts` et `database/schema.ts` | ❌ jamais importés (cités en commentaire seulement) |
| `memory/projectMemory.ts`, `memory/agentMemory.ts` | ❌ jamais importés — `agentOrchestrator.ts` en a **ses propres copies** en RAM |
| `i18n/` (7 fichiers, 6 langues) | ❌ jamais importés — aucune page n'est traduite |
| `lib/dataImporter.ts` | ❌ jamais importé — doublon de la logique de `/import` |
| `core/executionEngine.ts`, `core/execution.ts` | ❌ jamais importés |
| `core/agentPipeline.ts` (`runFullPipeline`) | ❌ jamais appelée |
| `core/workspaceFiles.ts`, `core/gitManager.ts`, `core/testRunner.ts`, `core/activityLog.ts` | ❌ jamais importés |
| `app/api/analysis/route.ts` | ❌ aucun `fetch()` dans tout le projet |
| `backend/` (FastAPI Python) | ❌ jamais appelé — et c'est l'ancienne architecture abandonnée |

Le dossier `backend/` mérite une décision : il **redouble en Python la logique des 4
agents** déjà écrite en TypeScript. Deux copies de la même règle métier finissent
toujours par diverger (c'est déjà le cas : le Python n'a ni Design ni Développeur).
L'architecture retenue étant Next.js seul, il est plus sain de le retirer du projet
actif — tout en le gardant dans une archive, jamais en le supprimant sans copie.

La mémoire en double est le doublon le plus gênant : `/overview` affiche « Mémoires
enregistrées » en lisant le tableau de `agentOrchestrator.ts`. Or la page d'accueil
relance l'agent Accueil **à chaque lettre tapée** dans le champ prénom (`useEffect`
sur `userName`), et chaque exécution ajoute une entrée. Le compteur de « mémoires »
compte donc en partie des frappes clavier — et retombe à 0 dès qu'on recharge la page.

---

## 8. Les données importées ne vont nulle part

`/import` lit correctement CSV, Excel et JSON, et affiche un aperçu propre de 10 lignes,
avec une vraie gestion d'erreur. Mais le fichier lu n'est **stocké nulle part** :
ni dans `store.ts`, ni dans le contexte, ni dans une mémoire. Les agents continuent de
travailler sur `SAMPLE_VALUES`. Aujourd'hui, importer un fichier ne change donc
strictement rien aux analyses.

---

## 9. Gouvernance : absente de cette version

Dans cette archive, il n'y a **ni `permissions.ts` ni `approval.ts`**. Il ne reste que
le drapeau `requiresApproval` du planificateur — un affichage, pas un contrôle : aucun
code ne vérifie qu'un agent a le droit de lire des fichiers ou de toucher à Git.
Ce n'est pas une régression à corriger dans le zip, c'est une raison de plus de ne pas
faire revenir cette version par-dessus le projet actuel, qui, lui, possède ces deux
fichiers.

Et il n'y a **aucune authentification** : `/login` et `/signup` font un `console.log`,
et `/dashboard` est accessible directement sans être connecté.

---

## 10. Petits pièges repérés au passage

- **`crypto.randomUUID()`** (`core/activityLog.ts`, `memory/projectMemory.ts`) :
  cette fonction n'existe **pas** en contexte non sécurisé (adresse en `http://`
  autre que `localhost`) ni sur Safari iOS avant 15.4. Sur iPad, en testant depuis une
  adresse locale du réseau, ça planterait. Les deux fichiers étant inutilisés
  aujourd'hui, la bombe est désamorcée — mais elle explosera le jour où on les branche.
  `database/schema.ts` génère ses identifiants autrement (`Date.now()` + aléatoire),
  sans ce problème : c'est la méthode à généraliser.
- **Répartition du budget publicitaire** : `Math.round((100 / n) * 10) / 10` donne
  33,3 % × 3 = **99,9 %**. Il manque 0,1 % — il faut donner le reste au dernier canal.
- **`npm run lint`** : pas d'ESLint installé ni configuré → la commande pose une
  question et attend une réponse. Sur son ordinateur, ça ressemble à un blocage.
  (Le `build`, lui, n'en dépend pas : il passe sans ESLint.)
- **Fichiers manquants à la racine de `frontend/`** : pas de `.gitignore` (risque
  d'envoyer `node_modules` sur GitHub), pas de `next.config.js`, pas de `.env.example`.
- **Détection d'anomalies** : seuil à 2 écarts-types sur des séries de 10 valeurs →
  en pratique, presque rien ne sera jamais signalé. À revoir quand de vraies données
  de vente arriveront.
- **Calcul de tendance** : compare la moyenne de la 1re moitié à celle de la 2nde.
  Correct et lisible, mais aveugle à la saisonnalité (un pic de fin de mois fera
  « hausse »). À garder en tête pour le tableau « flux de clients par heure/jour ».

---

## 11. Ce que je recommande, dans cet ordre

1. **Ne rien écraser.** Garder ce zip comme archive datée du 12/08, à côté du projet
   actuel — jamais par-dessus.
2. **Corriger l'erreur de compilation** (§3) et **monter `next` en 14.2.35** (§4) —
   mais **dans le projet actuel**, pas dans ce zip. Ce sont deux petites
   modifications, et ce sont les deux seules urgentes.
3. **Faire passer les pages par le moteur** (§5.1) : un seul chemin d'exécution
   (`runFullPipeline`), un seul contexte partagé, les chiffres d'exemple à un seul
   endroit. C'est ce qui rend visible à l'écran le fait que les agents se parlent.
4. **Ajouter `priority` et `targetAudience` au contexte partagé** (§5.2) et
   **harmoniser les noms de canaux** (§5.3). Petit changement, effet direct sur la
   cohérence des propositions de Design.
5. **Brancher `/import` sur les agents** (§8) : c'est ce qui transforme la
   démonstration en outil réel.
6. **Décider du sort de `backend/`** (§7) et de `xlsx` (§4).
7. **Rendre le Centre de commande exécutant** (§6) — le plus gros morceau, à faire
   après les précédents, et en gardant la pause de validation.

Les points 2, 4 et 6 sont courts. Les points 3 et 5 sont du vrai travail mais sans
risque. Le point 7 est le seul chantier.

---

## Un mot pour finir

Ce qui est dans ce zip n'est pas un brouillon. Le contexte partagé entre agents est
correctement conçu, les garde-fous entre agents sont réels et renvoient des messages
clairs, les six langues sont écrites, l'import gère trois formats avec ses erreurs, et
les 14 pages se construisent. Le problème n'est pas la qualité de ce qui a été écrit :
c'est qu'une partie n'a jamais été **reliée** au reste — et qu'une seule ligne, jamais
exécutée par personne, empêchait tout le reste de se déployer.
