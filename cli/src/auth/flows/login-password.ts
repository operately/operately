import { askQuestion, askPassword } from "../../core/prompts";
import { callInternalMutation } from "../../core/internal-api";
import { cliAuth } from "../shared/api";
import type { Company } from "../types";

interface PasswordFlowDeps {
  askQuestion: typeof askQuestion;
  askPassword: typeof askPassword;
  callInternalMutation: typeof callInternalMutation;
}

interface PasswordFlowOptions {
  email?: string;
  password?: string;
  inviteToken?: string;
}

export async function runPasswordFlow(
  baseUrl: string,
  deps: PasswordFlowDeps,
  options: string | PasswordFlowOptions = {},
): Promise<{ bootstrapToken: string; companies: Company[] }> {
  const normalized = typeof options === "string" ? { inviteToken: options } : options;
  const email = (normalized.email ?? await deps.askQuestion("Email:")).trim();
  const password = normalized.password ?? await deps.askPassword("Password:");

  const payload: Record<string, unknown> = { email, password };
  if (normalized.inviteToken) payload.invite_token = normalized.inviteToken;

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
