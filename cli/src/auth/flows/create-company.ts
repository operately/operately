import { DEFAULT_BASE_URL, resolveRuntimeOptions, type CliConfig } from "../config";
import { printError, printSuccess } from "../../core/output";
import { callInternalMutation, callInternalQuery } from "../../core/internal-api";
import { askChoice, askPassword, askQuestion, PromptCancelledError } from "../../core/prompts";
import { callEndpoint, ApiError } from "../../core/http";
import { runEmailCodeFlow } from "./login-email-code";
import { runGoogleFlow } from "./login-google";
import { runPasswordFlow } from "./login-password";
import { openExternalUrl } from "../shared/api";
import { createCompanyAndSaveProfile, resolveCompanyCreationMode } from "../shared/company-creation";
import { handleBootstrapError } from "../shared/errors";
import type { EndpointRegistry } from "../../commands/registry";
import type { CompanyCreationMode } from "../types";
import type { ChildProcess } from "child_process";

interface CreateCompanyFlowDeps {
  askChoice: typeof askChoice;
  askQuestion: typeof askQuestion;
  askPassword: typeof askPassword;
  callInternalMutation: typeof callInternalMutation;
  callInternalQuery: typeof callInternalQuery;
  callEndpoint: typeof callEndpoint;
  openUrl: (url: string) => Promise<ChildProcess | boolean | undefined>;
  printError: typeof printError;
  printSuccess: typeof printSuccess;
  resolveRuntimeOptions: typeof resolveRuntimeOptions;
}

const defaultDeps: CreateCompanyFlowDeps = {
  askChoice,
  askQuestion,
  askPassword,
  callInternalMutation,
  callInternalQuery,
  callEndpoint,
  openUrl: (url: string) => openExternalUrl(url),
  printError,
  printSuccess,
  resolveRuntimeOptions,
};

export async function runCreateCompanyFlow(
  flags: Map<string, unknown[]>,
  config: CliConfig,
  registry: EndpointRegistry,
  deps: Partial<CreateCompanyFlowDeps> = {},
): Promise<number> {
  const d = { ...defaultDeps, ...deps };

  if (readStringFlag(flags, "token")) {
    d.printError("`operately auth create-company` does not support `--token`. Use email/password, email code, or Google OAuth.");
    return 2;
  }

  let baseUrl = readStringFlag(flags, "base-url");
  const profileFlag = readStringFlag(flags, "profile");
  let runtimeBaseUrl = baseUrl ?? DEFAULT_BASE_URL;
  let bootstrapToken = "";
  let timeoutMs = 30_000;
  let companyCreationMode: CompanyCreationMode = "create";

  try {
    const method = await d.askChoice<"password" | "emailCode" | "google">("You need to authenticate to create a company. Choose a sign-in method:", [
      { label: "Email and password", value: "password" },
      { label: "Email code (no password)", value: "emailCode" },
      { label: "Google OAuth (opens browser)", value: "google" },
    ]);

    if (!baseUrl) {
      const answer = await d.askQuestion(`Base URL for the Operately instance (default: ${DEFAULT_BASE_URL}):`);
      baseUrl = answer.trim() || null;
    }

    const runtime = d.resolveRuntimeOptions(config, {
      token: null,
      baseUrl: baseUrl ?? null,
      profile: null,
    });
    runtimeBaseUrl = runtime.baseUrl;
    timeoutMs = runtime.timeoutMs;
    companyCreationMode = await resolveCompanyCreationMode(runtime.baseUrl, d.callInternalQuery);

    if (method === "password") {
      const result = await runPasswordFlow(runtime.baseUrl, {
        askQuestion: d.askQuestion,
        askPassword: d.askPassword,
        callInternalMutation: d.callInternalMutation,
      });
      bootstrapToken = result.bootstrapToken;
    } else if (method === "emailCode") {
      const result = await runEmailCodeFlow(runtime.baseUrl, {
        askQuestion: d.askQuestion,
        callInternalMutation: d.callInternalMutation,
      });
      bootstrapToken = result.bootstrapToken;
    } else {
      const result = await runGoogleFlow(runtime.baseUrl, {
        callInternalMutation: d.callInternalMutation,
        callInternalQuery: d.callInternalQuery,
        openUrl: d.openUrl,
      });
      bootstrapToken = result.bootstrapToken;
    }
  } catch (error) {
    return handleBootstrapError(error, runtimeBaseUrl, d.printError);
  }

  try {
    return await createCompanyAndSaveProfile({
      config,
      registry,
      profileFlag,
      explicitBaseUrl: baseUrl,
      runtimeBaseUrl,
      timeoutMs,
      bootstrapToken,
      mode: companyCreationMode,
      deps: {
        askQuestion: d.askQuestion,
        callInternalMutation: d.callInternalMutation,
        callEndpoint: d.callEndpoint,
        printError: d.printError,
        printSuccess: d.printSuccess,
      },
    });
  } catch (error) {
    if (error instanceof PromptCancelledError) {
      d.printError("Company creation cancelled.");
      return 1;
    }

    if (error instanceof ApiError) {
      if (error.status >= 500 || error.status === 0) {
        d.printError(`Server error at ${runtimeBaseUrl}. Please try again later.`);
        return 5;
      }

      d.printError(`Company creation failed: ${formatApiMessage(error)}`);
      return 1;
    }

    if (error instanceof Error) {
      d.printError(error.message);
      return 1;
    }

    d.printError("Unexpected error during company creation.");
    return 5;
  }
}

function readStringFlag(flags: Map<string, unknown[]>, name: string): string | null {
  const value = flags.get(name)?.at(-1);
  if (typeof value === "string") return value;
  return null;
}

function formatApiMessage(error: ApiError): string {
  const payload = error.payload;

  if (typeof payload === "object" && payload !== null && "message" in payload) {
    return String((payload as { message: string }).message);
  }

  if (typeof payload === "string") {
    return payload;
  }

  return JSON.stringify(payload);
}
