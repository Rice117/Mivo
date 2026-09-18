"""
orchestrator.py
Fait tourner les agents en leur partageant un contexte commun en temps réel :
chaque agent lit ce que les précédents ont déjà produit dans context["messages"]
et dans les clés qu'ils y déposent (ex: trend, positioning, channels),
plutôt que de tourner isolément.
"""

from orchestrator.registry import get_agent, list_agents


def run_pipeline(context: dict, pipeline: list[str] | None = None) -> dict:
    """
    Exécute une chaîne d'agents dans l'ordre donné (par défaut la chaîne
    complète Accueil -> Analyse -> Marketing -> Publicité), en partageant
    le même dict de contexte entre tous.
    """
    if pipeline is None:
        pipeline = ["welcome", "analysis", "marketing", "advertising"]

    context.setdefault("messages", [])
    results = {}

    for agent_id in pipeline:
        agent_module = get_agent(agent_id)
        if agent_module is None:
            results[agent_id] = {"status": "echec", "raison": "agent inconnu"}
            continue
        results[agent_id] = agent_module.run(context)

    return {
        "resultats": results,
        "messages": context["messages"],
        "agents_disponibles": list_agents(),
    }


def run_single(agent_id: str, context: dict) -> dict:
    agent_module = get_agent(agent_id)
    if agent_module is None:
        return {"status": "echec", "raison": "agent inconnu"}
    context.setdefault("messages", [])
    return agent_module.run(context)
