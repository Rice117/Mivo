# Comment récupérer ce travail sur mon ordinateur

À savoir d'abord : **Claude travaille dans le nuage, pas sur ton ordinateur.**
Rien de ce qui est écrit pendant une session en ligne n'arrive tout seul sur
ton disque. C'est pour ça que tu ne vois rien apparaître dans tes dossiers.
Le passage se fait par un zip téléchargé, ou par GitHub.

Rappel de ta règle : **toujours travailler sur le disque C:**, jamais depuis
une clé USB.

---

## Méthode 1 — Le zip et le double-clic (celle à utiliser)

1. Télécharge le zip envoyé dans la conversation.
2. Décompresse-le dans un dossier du **disque C:**, par exemple
   `C:\Projets\Azuska-Z`.
3. Ouvre le dossier et **double-clique sur `DEMARRER.bat`**.
4. Une fenêtre noire s'ouvre, puis le navigateur s'ouvre tout seul sur
   l'application.

Le premier démarrage installe les composants (quelques minutes, avec
internet). Les fois suivantes, c'est immédiat. Pour arrêter : ferme la
fenêtre noire. Tout est aussi expliqué dans `LIRE-MOI.txt`. Pour les mises à jour suivantes,
c'est `METTRE-A-JOUR.bat` — le dossier ne bouge plus jamais.

---

## Méthode 2 — GitHub Desktop (plus tard, quand tu voudras)

C'est celle à privilégier : tes dossiers restent liés à GitHub, et la
prochaine mise à jour sera un simple clic.

1. Ouvre **GitHub Desktop**.
2. Si le dépôt **Mivo** n'y est pas encore :
   `File` → `Clone repository` → onglet `GitHub.com` → choisis **Rice117/Mivo**
   → dans `Local path`, mets un dossier sur **C:** (par exemple
   `C:\Projets\Mivo`) → `Clone`.
3. Clique sur **`Fetch origin`** (en haut).
4. Clique sur le menu **`Current branch`** et choisis
   **`claude/claude-rc-j0u7hc`**.
5. Clique sur **`Pull origin`** s'il le propose.

Les dossiers `frontend/`, `documents/`, `archives/` et les fichiers
`.md` apparaissent alors dans ton dossier sur le disque C:.

Pour faire tourner l'application ensuite :

```
cd frontend
npm install
npm run dev
```

puis ouvrir http://localhost:3000 dans le navigateur.

---

## Méthode 3 — Télécharger le zip depuis GitHub

Si GitHub Desktop pose problème, ou depuis l'iPad :

1. Va sur **github.com/Rice117/Mivo**
2. Clique sur le menu des branches et choisis **`claude/claude-rc-j0u7hc`**
3. Bouton vert **`Code`** → **`Download ZIP`**
4. Décompresse le zip dans un dossier sur le disque **C:**

Inconvénient : ce dossier n'est pas relié à GitHub, il faudra retélécharger
à chaque mise à jour.

---

## Méthode 4 — Depuis une session Claude sur ton ordinateur

Si tu rallumes ton ordinateur et que tu ouvres Claude Code dessus, tu peux
lui demander :

> Va chercher la branche `claude/claude-rc-j0u7hc` du dépôt Rice117/Mivo et
> mets-la dans mes projets sur le disque C:.

Cette session-là, elle, travaille bien sur ton disque.

---

## Comment vérifier que tu as bien reçu la bonne version

Dans le dossier récupéré, tu dois trouver à la racine :

- `DEMARRER.bat`
- `METTRE-A-JOUR.bat`
- `LIRE-MOI.txt`
- `CLAUDE.md`
- `CORRECTIONS-2026-09-18.md`
- `README.md`
- `documents/captures-iphone/` (4 images)
- `frontend/` avec un dossier `tests/` dedans

Et dans `frontend/`, ces trois commandes doivent passer :

```
npm run verifier    (ne doit rien afficher)
npm test            (33 tests, 33 réussis)
npm run build       (doit réussir)
```

Si l'une échoue, quelque chose s'est mal copié : ne continue pas, redemande
une copie.
