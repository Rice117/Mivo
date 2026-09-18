"""
registry.py
Point central pour brancher chaque nouvel agent au système.
Ajouter une ligne ici suffit pour qu'un nouvel agent soit disponible
partout (orchestrateur, endpoint /agents, dashboard).
"""

from agents import welcome_agent, analysis_agent, marketing_agent, advertising_agent

AGENTS = {
    "welcome": {
        "id": "welcome",
        "nom": "Agent Accueil",
        "role": "Accueille l'utilisateur",
        "module": welcome_agent,
    },
    "analysis": {
        "id": "analysis",
        "nom": "Agent Analyse",
        "role": "Analyse les données importées (tendances, anomalies)",
        "module": analysis_agent,
    },
    "marketing": {
        "id": "marketing",
        "nom": "Agent Marketing",
        "role": "Définit la stratégie marketing à partir de l'analyse",
        "module": marketing_agent,
    },
    "advertising": {
        "id": "advertising",
        "nom": "Agent Publicité",
        "role": "Crée les campagnes publicitaires à partir de la stratégie",
        "module": advertising_agent,
    },
}


def get_agent(agent_id: str):
    entry = AGENTS.get(agent_id)
    return entry["module"] if entry else None


def list_agents() -> list[dict]:
    """Retourne la liste des agents sans exposer le module Python lui-même."""
    return [
        {"id": a["id"], "nom": a["nom"], "role": a["role"], "statut": "actif"}
        for a in AGENTS.values()
    ]
