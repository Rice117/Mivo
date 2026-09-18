# Corrections appliquées — 18/09/2026

Suite à l'audit (`AUDIT-azuska-z-2026-09-18.md`), tous les défauts relevés ont
été corrigés dans `frontend/`. Ce document dit ce qui a été fait, ce qui a été
**réellement vérifié**, et ce qui ne l'est pas.

---

## Vérifications réellement exécutées

| Commande | Avant | Après |
|---|---|---|
| `npm run build` | ❌ échouait | ✅ passe, 15 routes |
| `npm run verifier` (types, mode strict) | ❌ 1 erreur | ✅ aucune erreur |
| `npm test` | — (aucun test) | ✅ **33 tests, 33 réussis** |
| `npm audit` | 🔴 1 critique + 2 hautes (29 avis) | 🟠 1 haute (`xlsx` seul, 2 avis) |
| Navigateur réel au format iPhone 13 | jamais testé | ✅ 5 écrans, 0 débordement, 0 erreur JS |
| Poids de la page Import | 217 Ko | **107 Ko** |

Le parcours complet a été joué automatiquement dans un vrai navigateur, au
format iPhone : import d'un CSV de ventes en francs guinéens → choix de la
colonne → chaîne des agents → Centre de commande avec validation. Les images
sont dans `captures-iphone/`.

**Ce qui n'a pas pu être vérifié**, et que je n'affirme donc pas : le rendu sur
un **vrai** iPhone (le navigateur utilisé est Chromium au format iPhone, pas
Safari iOS), et le comportement avec tes vrais fichiers de vente.

---

## 1. Pourquoi l'application ne marchait pas sur ton iPhone

La cause principale n'était pas l'iPhone : **l'application ne se construisait
pas du tout**. Une seule ligne (`core/agentOrchestrator.ts:32`) faisait échouer
`npm run build`, donc le déploiement. Il n'y avait rien à afficher, nulle part.

Cause profonde corrigée : l'agent Développeur était déclaré dans la liste des
agents mais absent du registre. Le registre est maintenant typé
`Record<AgentId, AgentEntry>` — si un agent est déclaré et oublié, l'erreur
apparaît immédiatement au lieu de casser le déploiement.

Et sur l'iPhone lui-même, cinq défauts réels ont été corrigés :

- **Le zoom automatique de Safari.** Tous les champs étaient en 14 px ; Safari
  iOS agrandit toute la page dès qu'on touche un champ sous 16 px. Tous les
  champs sont passés à 16 px.
- **Aucune navigation.** On arrivait sur un écran sans aucun moyen d'en
  repartir : il n'y avait de liens que sur le tableau de bord. Une barre de
  navigation est maintenant présente sur toutes les pages.
- **Zones à toucher trop petites.** Tous les boutons et liens font désormais au
  moins 44 px de haut (la règle d'Apple) — vérifié automatiquement.
- **L'encoche et la barre du bas.** La page passait dessous ; `viewport-fit` et
  les marges de sécurité sont en place.
- **La page Import pesait 217 Ko.** La bibliothèque Excel (121 Ko) était
  chargée pour tout le monde, même sans fichier Excel. Elle n'est plus chargée
  que si tu choisis réellement un `.xlsx`. La page est passée à **107 Ko** —
  ça compte sur un téléphone en Guinée.

---

## 2. Pourquoi tu ne voyais aucune utilité — et ce qui change

Tu avais raison, et la raison est précise : **les chiffres que tu importais
n'allaient nulle part**. La page Import affichait un aperçu, puis oubliait le
fichier. Les agents, eux, continuaient à analyser une liste de dix nombres
écrite en dur dans le code, recopiée dans trois fichiers. Quoi que tu importes,
la réponse était la même. C'était une démonstration qui récitait.

Ce qui a été fait :

- Le fichier importé est **conservé** et devient la source de tous les agents.
- La lecture comprend les **vrais formats** : `1 250 000 GNF`, `1.250,50`,
  `12,5`, `45,5 %`, et les négatifs entre parenthèses de la comptabilité.
- L'application **repère toute seule** les colonnes de chiffres et te laisse
  choisir laquelle analyser (« Montant GNF » plutôt que « Quantité »).
- Chaque écran affiche désormais **d'où viennent les chiffres** : nom du
  fichier et colonne.

Deuxième raison, plus profonde : **les agents ne se parlaient qu'à moitié.**
L'agent Marketing décidait une priorité (« urgente » quand les ventes baissent)
mais ne la déposait nulle part ; l'agent Design la redevinait à sa façon, si
bien que la palette rouge prévue pour une baisse n'était **jamais** utilisée.
Et Marketing écrivait « SMS » là où Design cherchait « sms » : le canal
retombait sur un format générique sans qu'aucune erreur n'apparaisse.

Corrigé à la racine :

- Priorité et public cible sont maintenant **déposés dans le contexte partagé**
  et lus par les agents suivants — plus personne ne redevine.
- Les canaux ont des **identifiants stables** (`core/channels.ts`) ; le texte
  français n'est plus qu'un affichage. Un test vérifie que chaque canal produit
  par Marketing a bien un format côté Design.
- Les quatre pages Analyse / Marketing / Design / Publicité passent toutes par
  **un seul moteur** (`runFullPipeline`). Aucune page ne rejoue la chaîne dans
  son coin.
- Chaque écran montre le fil **« Ce que les agents se sont dit »** : tu vois
  l'enchaînement, au lieu de devoir croire sur parole qu'il a lieu.

Résultat visible (capture n° 2) : sur des ventes en baisse de 52,2 %, Analyse
détecte la baisse → Marketing passe en priorité urgente → Design sort la
palette rouge **et** un visuel de compte à rebours, *parce que* la priorité est
urgente.

---

## 3. Le Centre de commande exécute vraiment

Avant : le plan s'affichait, « Accepter le plan » n'avait aucun effet, et le
moteur d'exécution n'était appelé nulle part — il n'appelait d'ailleurs aucun
agent.

Maintenant :

- Le plan **complète tout seul les étapes manquantes**. « Prépare une campagne
  publicitaire » lance Analyse → Marketing → Publicité, et indique clairement
  les étapes ajoutées automatiquement.
- Les étapes sont remises **dans l'ordre de la chaîne**, pas dans l'ordre des
  mots de ta phrase.
- Les accents et les majuscules n'empêchent plus la reconnaissance.
- Les agents **s'exécutent réellement**, et l'exécution **s'arrête avant toute
  action sensible** (Publicité, Développeur) en expliquant ce qui va se passer.
  Tu valides ou tu refuses ; si tu refuses, le travail déjà fait est conservé.

C'est le flux de gouvernance du projet, appliqué à la lettre : l'agent prépare,
le moteur explique, tu confirmes, et seulement là l'action a lieu.

---

## 4. Sécurité

- `next` est passé de **14.2.5 à 16.3.5** et React de 18 à 19. Les 2 failles
  critiques (exécution de code à distance) et 10 failles hautes ont disparu.
  Testé avant d'être appliqué : la construction, les types et les 33 tests
  passent tous.
- Il reste **une seule** alerte : `xlsx` (lecture des fichiers Excel), sans
  correctif publié sur npm. Elle ne s'active qu'en lisant un fichier Excel, sur
  ton propre appareil, et la bibliothèque n'est plus chargée que dans ce cas.
  Si tu préfères la supprimer complètement, il suffira d'exporter tes fichiers
  Excel en CSV — dis-le-moi et je le fais.
- `crypto.randomUUID()` a été remplacé partout : cette fonction n'existe pas sur
  Safari iOS avant 15.4 ni sur une adresse en `http://`, et aurait provoqué un
  écran blanc sur ton iPhone le jour où ces fichiers auraient été branchés.

---

## 5. Les 33 tests automatiques

Ils ne testent pas « que le code existe » : chacun reproduit un défaut réel et
échouerait s'il revenait. Ils tournent avec l'outil livré avec Node —
**aucune nouvelle dépendance npm installée**, conformément à ta règle.

Ils couvrent : le registre complet des agents, la détection de tendance, les
valeurs inhabituelles, le refus de travailler sans données, le passage de
relais entre agents, la palette urgente, la correspondance des canaux, le
budget qui tombe à 100 %, la lecture des nombres à la française et en GNF, la
détection des colonnes, les accents dans le Centre de commande, l'ajout
automatique des prérequis, la pause de validation, la reprise et le refus.

Un défaut a d'ailleurs été trouvé **par le navigateur et non par les tests** :
le total du budget s'affichait `99.99999999999999 %` à cause des arrondis en
virgule flottante. Corrigé, avec un test ajouté pour qu'il ne revienne pas.

---

## 6. Ce qui reste volontairement non fait

- **Le cerveau IA n'est pas branché dans cette version.** C'est le manque le
  plus important : les agents appliquent des règles de calcul, ils ne
  réfléchissent pas encore. Attention — d'après l'état du projet, la connexion
  à l'API Claude existe déjà dans ta version de septembre, qui n'est pas celle
  de ce zip.
- **La mémoire repart de zéro à chaque rechargement** (Supabase reste à
  brancher). C'est écrit noir sur blanc sur la page Vue d'ensemble, pour ne pas
  laisser croire à un historique conservé.
- **Les comptes ne sont pas branchés.** Les écrans Connexion et Inscription le
  disent maintenant clairement, au lieu d'un bouton qui semblait fonctionner
  sans rien faire.
- **Les 6 langues** sont écrites mais pas encore utilisées par les écrans.
- **`backend/`** (l'ancienne API Python) n'est plus utilisé — voir
  `backend/LIRE-D-ABORD.md`. Rien n'a été supprimé.

---

## Et surtout

Ce dépôt contient la version du zip **du 12 août**. D'après l'état du projet,
ta version de septembre est plus avancée : cerveau IA connecté, `permissions.ts`,
`approval.ts`, 186+ tests, dossier `controle-qualite/`. **N'écrase pas ta
version actuelle avec celle-ci.** Dis-moi où elle vit et je porte exactement
les mêmes corrections là-bas — c'est le même travail, à refaire au bon endroit.
