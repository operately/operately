import { callEndpoint, ApiError } from "../../core/http";
import { printError, printSuccess } from "../../core/output";
import { callInternalMutation, callInternalQuery } from "../../core/internal-api";
import { saveProfile, writeConfig, type CliConfig } from "../config";
import { cliAuth } from "./api";
import { handleBootstrapError } from "./errors";
import { fetchProfileMetadata } from "./profile-metadata";
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
  callInternalMutation: typeof callInternalMutation;
  callEndpoint: typeof callEndpoint;
  printError: typeof printError;
  printSuccess: typeof printSuccess;
  saveProfile: typeof saveProfile;
  writeConfig: typeof writeConfig;
}

export async function createTokenAndSaveProfile(input: TokenCreationInput): Promise<number> {
  try {
    const tokenResult = (await input.callInternalMutation(
      input.runtimeBaseUrl,
      cliAuth.createToken,
      { company_id: input.company.id, read_only: input.readOnly },
      input.bootstrapToken,
    )) as { token: string; company: Company };

    const metadata = await fetchProfileMetadata({
      registry: input.registry,
      callEndpoint: input.callEndpoint,
      baseUrl: input.runtimeBaseUrl,
      token: tokenResult.token,
      timeoutMs: input.timeoutMs,
      fallbackCompanyName: tokenResult.company.name ?? input.company.name,
    });

    const updated = input.saveProfile(input.config, input.profile, {
      token: tokenResult.token,
      baseUrl: input.baseUrl ?? undefined,
      name: metadata.name,
      companyName: metadata.companyName,
    });
    input.writeConfig(updated);

    const displayUrl = updated.profiles[input.profile]?.baseUrl || input.runtimeBaseUrl;
    input.printSuccess(`Logged in to ${displayUrl} ${metadata.name ? `as ${metadata.name}` : ""}`);

    return 0;
  } catch (error) {
    return handleBootstrapError(error, input.runtimeBaseUrl, input.printError);
  }
}
