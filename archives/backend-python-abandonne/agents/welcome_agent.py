"""
Agent d'accueil (welcomeAgent)
Accueille l'utilisateur nommément si son prénom est connu.
"""

from datetime import datetime


def run(context: dict) -> dict:
    """
    context attendu (clés utilisées si présentes) :
      - user_name: str | None
    Retourne un dict ajouté au contexte partagé de l'orchestrateur,
    et un message lisible ajouté à context["messages"].
    """
    user_name = context.get("user_name")
    hour = datetime.now().hour

    if 5 <= hour < 12:
        moment = "Bonjour"
    elif 12 <= hour < 18:
        moment = "Bon après-midi"
    else:
        moment = "Bonsoir"

    if user_name:
        message = f"{moment} {user_name}, bienvenue sur Azuska Z."
    else:
        message = f"{moment}, bienvenue sur Azuska Z."

    result = {
        "agent": "welcome",
        "status": "success",
        "greeting": message,
    }

    context.setdefault("messages", []).append(
        {"agent": "welcome", "content": message}
    )

    return result
