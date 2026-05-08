import { askQuestion } from "../../core/prompts";
import { callInternalMutation } from "../../core/internal-api";
import { cliAuth } from "../shared/api";
import type { Company } from "../types";

interface EmailCodeFlowDeps {
  askQuestion: typeof askQuestion;
  callInternalMutation: typeof callInternalMutation;
}

interface EmailCodeFlowOptions {
  email?: string;
  inviteToken?: string;
}

export async function runEmailCodeFlow(
  baseUrl: string,
  deps: EmailCodeFlowDeps,
  options: EmailCodeFlowOptions = {},
): Promise<{ bootstrapToken: string; companies: Company[] }> {
  const email = (options.email ?? await deps.askQuestion("Email:")).trim();

  await deps.callInternalMutation(baseUrl, cliAuth.requestEmailCode, { email });

  const code = await deps.askQuestion("A verification code was sent to your email. Enter the code:");

  const authPayload: Record<string, unknown> = { email, code };
  if (options.inviteToken) authPayload.invite_token = options.inviteToken;

  const response = (await deps.callInternalMutation(baseUrl, cliAuth.authEmailCode, authPayload)) as {
    status: string;
    companies: Company[];
    bootstrap_token?: string;
    message?: string;
  };

  if (!response.bootstrap_token) {
    throw new Error("Authentication failed: no bootstrap token returned");
  }

  return {
    bootstrapToken: response.bootstrap_token,
    companies: response.companies ?? [],
  };
}
