import {
  resolveRuntimeOptions,
  saveProfile,
  writeConfig,
  DEFAULT_BASE_URL,
  type CliConfig,
} from "./config";
import { printError, printSuccess } from "../core/output";
import { callInternalMutation, callInternalQuery } from "../core/internal-api";
import { askQuestion, askChoice, askPassword, PromptCancelledError } from "../core/prompts";
import { callEndpoint, ApiError } from "../core/http";
import { runPasswordFlow } from "./flows/login-password";
import { runGoogleFlow } from "./flows/login-google";
import { runTokenFlow } from "./flows/login-token";
import { selectCompany } from "./shared/company-selection";
import { createTokenAndSaveProfile } from "./shared/token-creation";
import { openExternalUrl } from "./shared/api";
import { handleBootstrapError } from "./shared/errors";
import type { EndpointRegistry } from "../commands/registry";
import type { Company } from "./types";
import type { ChildProcess } from "child_process";

export interface BootstrapDeps {
  askChoice: typeof askChoice;
  askQuestion: typeof askQuestion;
  askPassword: typeof askPassword;
  callInternalMutation: typeof callInternalMutation;
  callInternalQuery: typeof callInternalQuery;
  callEndpoint: typeof callEndpoint;
  openUrl: (url: string) => Promise<ChildProcess | boolean | undefined>;
  printError: typeof printError;
  printSuccess: typeof printSuccess;
  saveProfile: typeof saveProfile;
  writeConfig: typeof writeConfig;
  resolveRuntimeOptions: typeof resolveRuntimeOptions;
}

const defaultDeps: BootstrapDeps = {
  askChoice,
  askQuestion,
  askPassword,
  callInternalMutation,
  callInternalQuery,
  callEndpoint,
  openUrl: (url: string) => openExternalUrl(url),
  printError,
  printSuccess,
  saveProfile,
  writeConfig,
  resolveRuntimeOptions,
};

export async function executeAuthBootstrap(
  flags: Map<string, unknown[]>,
  config: CliConfig,
  registry: EndpointRegistry,
  deps: Partial<BootstrapDeps> = {},
): Promise<number> {
  const d = { ...defaultDeps, ...deps };

  let baseUrl = readStringFlag(flags, "base-url");
  let profile = readStringFlag(flags, "profile");
  let runtimeBaseUrl = baseUrl ?? DEFAULT_BASE_URL;

  try {
    const method = await d.askChoice<string>("How would you like to authenticate?", [
      { label: "Email and password", value: "password" },
      { label: "Google OAuth (opens browser)", value: "google" },
      { label: "I have an API token", value: "token" },
    ]);

    if (!baseUrl) {
      const answer = await d.askQuestion(
        `Base URL for the Operately instance (default: ${DEFAULT_BASE_URL}):`,
      );
      baseUrl = answer.trim() || null;
    }

    if (!profile) {
      const answer = await d.askQuestion(
        `Profile name (default: default):`,
      );
      profile = answer.trim() || "default";
    }

    const runtime = d.resolveRuntimeOptions(config, {
      token: null,
      baseUrl: baseUrl ?? null,
      profile: null,
    });
    runtimeBaseUrl = runtime.baseUrl;

    if (method === "token") {
      return await runTokenFlow(
        runtime.baseUrl,
        runtime.timeoutMs,
        baseUrl ?? null,
        profile,
        config,
        registry,
        {
          askQuestion: d.askQuestion,
          callEndpoint: d.callEndpoint,
          saveProfile: d.saveProfile,
          writeConfig: d.writeConfig,
          printError: d.printError,
          printSuccess: d.printSuccess,
        },
      );
    }

    let bootstrapToken: string;
    let companies: Company[];

    if (method === "password") {
      const result = await runPasswordFlow(runtime.baseUrl, {
        askQuestion: d.askQuestion,
        askPassword: d.askPassword,
        callInternalMutation: d.callInternalMutation,
      });
      bootstrapToken = result.bootstrapToken;
      companies = result.companies;
    } else {
      const result = await runGoogleFlow(runtime.baseUrl, {
        callInternalMutation: d.callInternalMutation,
        callInternalQuery: d.callInternalQuery,
        openUrl: d.openUrl,
      });
      bootstrapToken = result.bootstrapToken;
      companies = result.companies;
    }

    if (companies.length === 0) {
      d.printError("No companies found for this account.");
      d.printError("Please join or create a company first.");
      return 1;
    }

    const company = await selectCompany(companies);

    const readOnly = await d.askChoice<boolean>("Select access mode:", [
      { label: "Read-only", value: true },
      { label: "Full access", value: false },
    ]);

    return await createTokenAndSaveProfile({
      baseUrl: baseUrl ?? null,
      profile,
      config,
      runtimeBaseUrl: runtime.baseUrl,
      bootstrapToken,
      company,
      readOnly,
      timeoutMs: runtime.timeoutMs,
      registry,
    });
  } catch (error) {
    return handleBootstrapError(error, runtimeBaseUrl, d.printError);
  }
}

function readStringFlag(flags: Map<string, unknown[]>, name: string): string | null {
  const value = flags.get(name)?.at(-1);
  if (typeof value === "string") return value;
  return null;
}
