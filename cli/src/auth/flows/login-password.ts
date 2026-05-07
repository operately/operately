import { askQuestion, askPassword } from "../../core/prompts";
import { callInternalMutation } from "../../core/internal-api";
import { cliAuth } from "../shared/api";
import type { Company } from "../types";

interface PasswordFlowDeps {
  askQuestion: typeof askQuestion;
  askPassword: typeof askPassword;
  callInternalMutation: typeof callInternalMutation;
}

export async function runPasswordFlow(
  baseUrl: string,
  deps: PasswordFlowDeps,
  inviteToken?: string,
): Promise<{ bootstrapToken: string; companies: Company[] }> {
  const email = await deps.askQuestion("Email:");
  const password = await deps.askPassword("Password:");

  const payload: Record<string, unknown> = { email, password };
  if (inviteToken) payload.invite_token = inviteToken;

  const response = (await deps.callInternalMutation(baseUrl, cliAuth.authPassword, payload)) as {
    status: string;
    companies: Company[];
    bootstrap_token?: string;
    message?: string;
  };

  if (response.status === "no_companies") {
    if (!response.bootstrap_token) {
      throw new Error("Authentication failed: no bootstrap token returned");
    }

    return { bootstrapToken: response.bootstrap_token, companies: [] };
  }

  if (!response.bootstrap_token) {
    throw new Error("Authentication failed: no bootstrap token returned");
  }

  return { bootstrapToken: response.bootstrap_token, companies: response.companies ?? [] };
}
