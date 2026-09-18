"""
Agent marketing (marketingAgent)
Lit la tendance déjà calculée par analysisAgent dans le contexte partagé
pour ajuster sa stratégie, au lieu de tourner isolément.
"""

CHANNELS_BY_TREND = {
    "hausse": ["publicité payante", "réseaux sociaux", "email"],
    "baisse": ["promotions ciblées", "réactivation clients", "SMS"],
    "stable": ["contenu organique", "programme de fidélité"],
}


def run(context: dict) -> dict:
    """
    context attendu :
      - objective: str | None   (ex: "augmenter les ventes")
      - product: str | None
      - trend: str (fourni par analysisAgent, lu depuis le contexte partagé)
    """
    objective = context.get("objective", "développer les ventes")
    product = context.get("product", "produit non précisé")
    trend = context.get("trend", "stable")  # interconnexion avec analysisAgent

    channels = CHANNELS_BY_TREND.get(trend, CHANNELS_BY_TREND["stable"])

    if trend == "hausse":
        positioning = f"Capitaliser sur la dynamique actuelle de {product}."
        priority = "haute"
    elif trend == "baisse":
        positioning = f"Relancer l'intérêt pour {product} avant que la baisse ne s'accentue."
        priority = "urgente"
    else:
        positioning = f"Consolider la présence de {product} sur son marché."
        priority = "normale"

    strategy = {
        "agent": "marketing",
        "status": "success",
        "objectif": objective,
        "produit": product,
        "positionnement": positioning,
        "public_cible": "clients existants" if trend != "hausse" else "nouveaux clients et clients existants",
        "canaux": channels,
        "priorite": priority,
    }

    context["positioning"] = positioning
    context["channels"] = channels
    context.setdefault("messages", []).append(
        {
            "agent": "marketing",
            "content": f"Stratégie ({priority}) : {positioning} Canaux retenus : {', '.join(channels)}.",
        }
    )

    return strategy
