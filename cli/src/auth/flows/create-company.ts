import { DEFAULT_BASE_URL, resolveRuntimeOptions, type CliConfig } from "../config";
import { printError, printInfo, printSuccess } from "../../core/output";
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

type CreateCompanyMethod = "password" | "emailCode" | "google";

interface CreateCompanyFlagOptions {
  baseUrl: string | null;
  profile: string | null;
  method: CreateCompanyMethod | null;
  email: string | null;
  password: string | null;
  companyName: string | null;
}

class CreateCompanyFlagError extends Error {}

interface CreateCompanyFlowDeps {
  askChoice: typeof askChoice;
  askQuestion: typeof askQuestion;
  askPassword: typeof askPassword;
  callInternalMutation: typeof callInternalMutation;
  callInternalQuery: typeof callInternalQuery;
  callEndpoint: typeof callEndpoint;
  openUrl: (url: string) => Promise<ChildProcess | boolean | undefined>;
  printError: typeof printError;
  printInfo: typeof printInfo;
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
  printInfo,
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

  if (flags.has("token")) {
    d.printError("`operately auth create-company` does not support `--token`. Use email/password, email code, or Google OAuth.");
    return 2;
  }

  let options = emptyCreateCompanyFlagOptions();
  let baseUrl: string | null = null;
  let profileFlag: string | null = null;
  let runtimeBaseUrl = baseUrl ?? DEFAULT_BASE_URL;
  let bootstrapToken = "";
  let timeoutMs = 30_000;
  let companyCreationMode: CompanyCreationMode = "create";

  try {
    options = parseCreateCompanyFlagOptions(flags);
    validateCreateCompanyFlagOptions(flags, options);

    baseUrl = options.baseUrl;
    profileFlag = options.profile;
    runtimeBaseUrl = baseUrl ?? DEFAULT_BASE_URL;

    const method =
      options.method ??
      await d.askChoice<"password" | "emailCode" | "google">("You need to authenticate to create a company. Choose a sign-in method:", [
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
      }, {
        email: options.email ?? undefined,
        password: options.password ?? undefined,
      });
      bootstrapToken = result.bootstrapToken;
    } else if (method === "emailCode") {
      const result = await runEmailCodeFlow(runtime.baseUrl, {
        askQuestion: d.askQuestion,
        callInternalMutation: d.callInternalMutation,
      }, {
        email: options.email ?? undefined,
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
    if (error instanceof CreateCompanyFlagError) {
      d.printError(error.message);
      return 2;
    }

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
      companyName: options.companyName,
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

function parseCreateCompanyFlagOptions(flags: Map<string, unknown[]>): CreateCompanyFlagOptions {
  return {
    baseUrl: readStringFlag(flags, "base-url"),
    profile: readStringFlag(flags, "profile"),
    method: normalizeCreateCompanyMethod(readStringFlag(flags, "method")),
    email: readStringFlag(flags, "email"),
    password: readStringFlag(flags, "password"),
    companyName: readStringFlag(flags, "company-name"),
  };
}

function validateCreateCompanyFlagOptions(
  flags: Map<string, unknown[]>,
  options: Pick<CreateCompanyFlagOptions, "method">,
): void {
  if (options.method === "google" && (flags.has("email") || flags.has("password"))) {
    throw new CreateCompanyFlagError("`--method google` cannot be combined with `--email` or `--password`.");
  }

  if (options.method === "emailCode" && flags.has("password")) {
    throw new CreateCompanyFlagError("`--method email-code` cannot be combined with `--password`.");
  }
}

function normalizeCreateCompanyMethod(value: string | null): CreateCompanyMethod | null {
  if (value === null) return null;

  const normalized = value.trim().toLowerCase();

  if (normalized === "email-password" || normalized === "password") {
    return "password";
  }

  if (normalized === "email-code" || normalized === "emailcode") {
    return "emailCode";
  }

  if (normalized === "google") {
    return "google";
  }

  throw new CreateCompanyFlagError("Invalid value for `--method`. Use `email-password`, `email-code`, or `google`.");
}

function emptyCreateCompanyFlagOptions(): CreateCompanyFlagOptions {
  return {
    baseUrl: null,
    profile: null,
    method: null,
    email: null,
    password: null,
    companyName: null,
  };
}

function readStringFlag(flags: Map<string, unknown[]>, name: string): string | null {
  const value = flags.get(name)?.at(-1);

  if (value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  throw new CreateCompanyFlagError(`Flag \`--${name}\` requires a value.`);
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
