"""
Agent publicité (advertisingAgent)
Lit le positionnement produit par marketingAgent (via le contexte partagé)
pour générer une accroche et un plan de campagne cohérents.
"""


def run(context: dict) -> dict:
    """
    context attendu :
      - ad_objective: str | None
      - product: str | None
      - positioning: str (fourni par marketingAgent)
      - channels: list[str] (fourni par marketingAgent)
    """
    product = context.get("product", "produit non précisé")
    positioning = context.get("positioning")
    channels = context.get("channels", [])
    ad_objective = context.get("ad_objective", "générer des ventes")

    if not positioning:
        result = {
            "agent": "advertising",
            "status": "echec",
            "raison": "positionnement marketing manquant, exécuter l'agent marketing d'abord",
        }
        context.setdefault("messages", []).append(
            {"agent": "advertising", "content": "En attente du positionnement marketing."}
        )
        return result

    headline = f"{product} : {positioning.rstrip('.')}."
    budget_split = {
        channel: round(100 / len(channels), 1) if channels else 0
        for channel in channels
    }

    campaign = {
        "agent": "advertising",
        "status": "success",
        "objectif_publicitaire": ad_objective,
        "produit": product,
        "accroche": headline,
        "repartition_budget_pourcent": budget_split,
        "canaux": channels,
    }

    context.setdefault("messages", []).append(
        {
            "agent": "advertising",
            "content": f"Campagne créée : « {headline} » diffusée sur {', '.join(channels) or 'aucun canal défini'}.",
        }
    )

    return campaign
