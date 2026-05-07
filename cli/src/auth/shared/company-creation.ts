import { callEndpoint, ApiError } from "../../core/http";
import { printError, printSuccess } from "../../core/output";
import { askQuestion } from "../../core/prompts";
import { callInternalMutation } from "../../core/internal-api";
import { saveProfile, writeConfig, type CliConfig } from "../config";
import { cliAuth } from "./api";
import { createTokenAndSaveProfile } from "./token-creation";
import type { EndpointRegistry } from "../../commands/registry";
import type { Company } from "../types";

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
  deps: CreateCompanyAndSaveProfileDeps;
}

export async function createCompanyAndSaveProfile(input: CreateCompanyAndSaveProfileInput): Promise<number> {
  const companyName = await input.deps.askQuestion("Company name:");

  let company: Company;

  try {
    const result = (await input.deps.callInternalMutation(
      input.runtimeBaseUrl,
      cliAuth.createCompany,
      { company_name: companyName },
      input.bootstrapToken,
    )) as { company?: Company };

    company = assertCompany(result.company);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 403) {
      throw error;
    }

    const result = (await input.deps.callInternalMutation(
      input.runtimeBaseUrl,
      cliAuth.createCompanyOnNonEmpty,
      { company_name: companyName },
      input.bootstrapToken,
    )) as { company?: Company };

    company = assertCompany(result.company);
  }

  const profile = await resolveProfileName(input.profileFlag, input.deps.askQuestion);

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

function assertCompany(company: Company | undefined): Company {
  if (!company?.id) {
    throw new Error("Company creation failed: no company returned.");
  }

  return company;
}

async function resolveProfileName(
  profileFlag: string | null,
  askQuestionFn: typeof askQuestion,
): Promise<string> {
  if (profileFlag && profileFlag.trim()) {
    return profileFlag.trim();
  }

  const answer = await askQuestionFn("Profile name (default: default):");
  return answer.trim() || "default";
}
