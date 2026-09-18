"""
main.py
API FastAPI exposant l'orchestrateur multi-agents Azuska Z.
Le site Next.js appelle cette API pour afficher le travail des agents en direct.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from orchestrator.orchestrator import run_pipeline, run_single
from orchestrator.registry import list_agents

app = FastAPI(title="Azuska Z - API Agents")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # à restreindre au domaine du site en production
    allow_methods=["*"],
    allow_headers=["*"],
)


class RunRequest(BaseModel):
    user_name: str | None = None
    objective: str | None = None
    values: list[float] | None = None
    product: str | None = None
    ad_objective: str | None = None


@app.get("/agents")
def get_agents():
    """Liste des agents disponibles, utilisée par le dashboard et la page /agents."""
    return {"agents": list_agents()}


@app.post("/run")
def run_all_agents(payload: RunRequest):
    """Lance la chaîne complète Accueil -> Analyse -> Marketing -> Publicité."""
    context = payload.model_dump(exclude_none=True)
    return run_pipeline(context)


@app.post("/run/{agent_id}")
def run_one_agent(agent_id: str, payload: RunRequest):
    """Lance un seul agent (utile pour tester une page isolément)."""
    context = payload.model_dump(exclude_none=True)
    return run_single(agent_id, context)


@app.get("/")
def root():
    return {"status": "ok", "message": "API Azuska Z opérationnelle"}
