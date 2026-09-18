"""
Agent d'analyse (analysisAgent)
Calcule une tendance, détecte des anomalies et propose des recommandations
à partir d'une série de valeurs numériques (ex: ventes, stock).
"""

import statistics


def _compute_trend(values: list[float]) -> str:
    if len(values) < 2:
        return "insuffisant"
    first_half = values[: len(values) // 2]
    second_half = values[len(values) // 2 :]
    avg_first = statistics.mean(first_half)
    avg_second = statistics.mean(second_half)
    if avg_first == 0:
        return "stable"
    variation = (avg_second - avg_first) / avg_first
    if variation > 0.05:
        return "hausse"
    if variation < -0.05:
        return "baisse"
    return "stable"


def _find_anomalies(values: list[float]) -> list[dict]:
    if len(values) < 3:
        return []
    mean = statistics.mean(values)
    stdev = statistics.pstdev(values) or 1
    anomalies = []
    for i, v in enumerate(values):
        z = (v - mean) / stdev
        if abs(z) >= 2:
            anomalies.append({"index": i, "value": v, "ecart_type": round(z, 2)})
    return anomalies


def run(context: dict) -> dict:
    """
    context attendu :
      - values: list[float]  (ex: chiffre d'affaires par jour/semaine)
      - product: str | None
    """
    values = context.get("values") or []
    product = context.get("product", "produit non précisé")

    if not values:
        result = {
            "agent": "analysis",
            "status": "echec",
            "raison": "données insuffisantes",
        }
        context.setdefault("messages", []).append(
            {"agent": "analysis", "content": "Pas assez de données pour analyser."}
        )
        return result

    trend = _compute_trend(values)
    anomalies = _find_anomalies(values)

    recommendations = []
    if trend == "hausse":
        recommendations.append(f"Renforcer le stock de {product}, la demande progresse.")
    elif trend == "baisse":
        recommendations.append(f"Surveiller {product}, la demande ralentit.")
    else:
        recommendations.append(f"Maintenir le niveau de stock actuel pour {product}.")

    if anomalies:
        recommendations.append(
            f"{len(anomalies)} valeur(s) inhabituelle(s) détectée(s), à vérifier manuellement."
        )

    result = {
        "agent": "analysis",
        "status": "success",
        "produit": product,
        "tendance": trend,
        "anomalies": anomalies,
        "recommandations": recommendations,
    }

    context["trend"] = trend
    context["anomalies"] = anomalies
    context.setdefault("messages", []).append(
        {
            "agent": "analysis",
            "content": f"Tendance {trend} détectée pour {product}. "
            + " ".join(recommendations),
        }
    )

    return result
