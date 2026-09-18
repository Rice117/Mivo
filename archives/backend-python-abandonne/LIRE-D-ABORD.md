# Ce dossier n'est plus utilisé

Ce dossier `backend/` est l'**ancienne architecture** : une API Python (FastAPI)
qui refaisait, en Python, le travail des agents déjà écrits en TypeScript.

Il n'est appelé par aucune page : l'application Next.js ne fait aucun appel
vers lui. Il ne contient d'ailleurs ni l'agent Design ni l'agent Développeur —
les deux copies ont déjà divergé, ce qui est exactement le risque d'avoir deux
fois la même règle métier à deux endroits.

Il est conservé ici pour ne rien perdre, pas pour être repris. **Ne pas y
ajouter de nouvelle fonctionnalité** : tout se passe maintenant dans
`frontend/`.

Si tu veux un jour une vraie API séparée, il vaudra mieux repartir de
`frontend/app/api/`, qui utilise les mêmes agents que les pages — une seule
règle, un seul endroit.
