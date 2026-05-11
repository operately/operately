import { callEndpoint } from "../../core/http";
import { printError, printSuccess } from "../../core/output";
import { askQuestion } from "../../core/prompts";
import { callInternalMutation, callInternalQuery } from "../../core/internal-api";
import { saveProfile, writeConfig, type CliConfig } from "../config";
import { cliAuth } from "./api";
import { requireCompany, resolveProfileName } from "./helpers";
import { createTokenAndSaveProfile } from "./token-creation";
import type { EndpointRegistry } from "../../commands/registry";
import type { Company, CompanyCreationMode } from "../types";

interface CreateCompanyAndSaveProfileDeps {
  askQuestion: typeof askQuestion;
  callInternalMutation: typeof callInternalMutation;
  callEndpoint: typeof callEndpoint;
  printError: typeof printError;
  printSuccess: typeof printSuccess;
}

interface CreateCompanyAndSaveProfileInput {
  config: CliConfig;
  registry: EndpointRegistry;
  profileFlag: string | null;
  explicitBaseUrl: string | null;
  runtimeBaseUrl: string;
  timeoutMs: number;
  bootstrapToken: string;
  mode: CompanyCreationMode;
  companyName?: string | null;
  deps: CreateCompanyAndSaveProfileDeps;
}

export async function resolveCompanyCreationMode(
  baseUrl: string,
  queryFn: typeof callInternalQuery,
): Promise<CompanyCreationMode> {
  const result = (await queryFn(baseUrl, cliAuth.companyCreationStatus, {})) as { configured?: boolean };
  return result.configured ? "create" : "setup";
}

export async function createCompanyAndSaveProfile(input: CreateCompanyAndSaveProfileInput): Promise<number> {
  const companyName = input.companyName ?? await input.deps.askQuestion("Company name:");
  const path = input.mode === "setup" ? cliAuth.setupCompany : cliAuth.createCompany;

  const result = (await input.deps.callInternalMutation(
    input.runtimeBaseUrl,
    path,
    { company_name: companyName },
    input.bootstrapToken,
  )) as { company?: Company };
  const company = requireCompany(result.company, "Company creation failed: no company returned.");

  const profile = await resolveProfileName(input.config, input.profileFlag, input.deps.askQuestion);

  return createTokenAndSaveProfile({
    baseUrl: input.explicitBaseUrl,
    profile,
    config: input.config,
    runtimeBaseUrl: input.runtimeBaseUrl,
    bootstrapToken: input.bootstrapToken,
    company,
    readOnly: false,
    timeoutMs: input.timeoutMs,
    registry: input.registry,
    callInternalMutation: input.deps.callInternalMutation,
    callEndpoint: input.deps.callEndpoint,
    printError: input.deps.printError,
    printSuccess: input.deps.printSuccess,
    saveProfile,
    writeConfig,
  });
}
