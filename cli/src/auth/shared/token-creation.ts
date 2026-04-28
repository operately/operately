import { callEndpoint } from "../../core/http";
import { printSuccess } from "../../core/output";
import { callInternalMutation } from "../../core/internal-api";
import { saveProfile, writeConfig, type CliConfig } from "../config";
import { cliAuth } from "./api";
import type { Company } from "../types";
import type { EndpointRegistry } from "../../commands/registry";

export interface TokenCreationInput {
  baseUrl: string | null;
  profile: string;
  config: CliConfig;
  runtimeBaseUrl: string;
  bootstrapToken: string;
  company: Company;
  readOnly: boolean;
  timeoutMs: number;
  registry: EndpointRegistry;
}

export async function createTokenAndSaveProfile(input: TokenCreationInput): Promise<number> {
  const tokenResult = (await callInternalMutation(
    input.runtimeBaseUrl,
    cliAuth.createToken,
    { company_id: input.company.id, read_only: input.readOnly },
    input.bootstrapToken,
  )) as { token: string; company: Company };

  const updated = saveProfile(input.config, input.profile, {
    token: tokenResult.token,
    baseUrl: input.baseUrl ?? undefined,
  });
  writeConfig(updated);

  const getMe = input.registry.find(["people", "get_me"]);

  if (getMe) {
    const payload = await callEndpoint({
      endpoint: getMe,
      baseUrl: input.runtimeBaseUrl,
      token: tokenResult.token,
      inputs: {},
      timeoutMs: input.timeoutMs,
      verbose: false,
    });
    const user = payload as { me?: { full_name?: string; email?: string } };
    const userName = user.me?.full_name || user.me?.email;
    const displayUrl = updated.profiles[input.profile]?.baseUrl || input.runtimeBaseUrl;
    printSuccess(`Logged in to ${displayUrl} ${userName ? `as ${userName}` : ""}`);
  } else {
    printSuccess("Authentication successful.");
  }

  return 0;
}
