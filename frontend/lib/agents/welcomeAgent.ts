// lib/agents/welcomeAgent.ts
import { Agent, AgentResult, SharedContext } from "../../core/agentTypes";

export function moment(hour: number = new Date().getHours()): string {
  if (hour >= 5 && hour < 12) return "Bonjour";
  if (hour >= 12 && hour < 18) return "Bon après-midi";
  return "Bonsoir";
}

export const welcomeAgent: Agent = {
  run(context: SharedContext): AgentResult {
    const greeting = context.userName
      ? `${moment()} ${context.userName}, bienvenue sur Azuska Z.`
      : `${moment()}, bienvenue sur Azuska Z.`;

    context.messages.push({ agent: "welcome", content: greeting });

    return { agent: "welcome", status: "success", greeting };
  },
};
