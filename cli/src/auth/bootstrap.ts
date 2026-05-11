import {
  resolveRuntimeOptions,
  saveProfile,
  writeConfig,
  DEFAULT_BASE_URL,
  type CliConfig,
} from "./config";
import { printError, printInfo, printSuccess } from "../core/output";
import { callInternalMutation, callInternalQuery } from "../core/internal-api";
import { askQuestion, askChoice, askPassword } from "../core/prompts";
import { callEndpoint } from "../core/http";
import { runEmailCodeFlow } from "./flows/login-email-code";
import { runPasswordFlow } from "./flows/login-password";
import { runGoogleFlow } from "./flows/login-google";
import { runTokenFlow } from "./flows/login-token";
import { selectCompany } from "./shared/company-selection";
import { createTokenAndSaveProfile } from "./shared/token-creation";
import { openExternalUrl } from "./shared/api";
import { handleBootstrapError } from "./shared/errors";
import { resolveProfileName } from "./shared/helpers";
import type { EndpointRegistry } from "../commands/registry";
import type { Company, AuthMethod } from "./types";
import type { ChildProcess } from "child_process";

type HybridLoginMethod = Exclude<AuthMethod, "token">;

interface LoginFlagOptions {
  baseUrl: string | null;
  profile: string | null;
  method: HybridLoginMethod | null;
  email: string | null;
  password: string | null;
  companyId: string | null;
  companyName: string | null;
  readOnly: boolean | null;
}

class LoginFlagError extends Error {}

export interface BootstrapDeps {
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
  printInfo,
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

  let options: LoginFlagOptions;
  let baseUrl: string | null = null;
  let profile: string | null = null;
  let runtimeBaseUrl = DEFAULT_BASE_URL;

  try {
    options = parseLoginFlagOptions(flags);
    validateLoginFlagOptions(flags, options);

    baseUrl = options.baseUrl;
    profile = options.profile;
    runtimeBaseUrl = baseUrl ?? DEFAULT_BASE_URL;

    const method =
      options.method ??
      await d.askChoice<AuthMethod>("How would you like to authenticate?", [
        { label: "Email and password", value: "password" },
        { label: "Email code (no password)", value: "emailCode" },
        { label: "Google OAuth (opens browser)", value: "google" },
        { label: "I have an API token", value: "token" },
      ]);

    if (!baseUrl) {
      const answer = await d.askQuestion(
        `Base URL for the Operately instance (default: ${DEFAULT_BASE_URL}):`,
      );
      baseUrl = answer.trim() || null;
    }

    profile = await resolveProfileName(config, profile, d.askQuestion);

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
      }, {
        email: options.email ?? undefined,
        password: options.password ?? undefined,
      });
      bootstrapToken = result.bootstrapToken;
      companies = result.companies;
    } else if (method === "emailCode") {
      const result = await runEmailCodeFlow(runtime.baseUrl, {
        askQuestion: d.askQuestion,
        callInternalMutation: d.callInternalMutation,
      }, {
        email: options.email ?? undefined,
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
      d.printError("Use `operately auth create-company` to create a company or `operately auth join` to join an existing one.");
      return 1;
    }

    const company = await resolveLoginCompany(companies, options, d.askChoice);

    const readOnly =
      options.readOnly ??
      await d.askChoice<boolean>("Select access mode:", [
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
      callInternalMutation: d.callInternalMutation,
      callEndpoint: d.callEndpoint,
      printError: d.printError,
      printSuccess: d.printSuccess,
      saveProfile: d.saveProfile,
      writeConfig: d.writeConfig,
    });
  } catch (error) {
    if (error instanceof LoginFlagError) {
      d.printError(error.message);
      return 2;
    }

    return handleBootstrapError(error, runtimeBaseUrl, d.printError);
  }
}

function parseLoginFlagOptions(flags: Map<string, unknown[]>): LoginFlagOptions {
  return {
    baseUrl: readStringFlag(flags, "base-url"),
    profile: readStringFlag(flags, "profile"),
    method: normalizeLoginMethod(readStringFlag(flags, "method")),
    email: readStringFlag(flags, "email"),
    password: readStringFlag(flags, "password"),
    companyId: readStringFlag(flags, "company-id"),
    companyName: readStringFlag(flags, "company-name"),
    readOnly: normalizeAccessMode(readStringFlag(flags, "access-mode")),
  };
}

function validateLoginFlagOptions(
  flags: Map<string, unknown[]>,
  options: Pick<LoginFlagOptions, "method">,
): void {
  if (options.method === "google" && (flags.has("email") || flags.has("password"))) {
    throw new LoginFlagError("`--method google` cannot be combined with `--email` or `--password`.");
  }

  if (options.method === "emailCode" && flags.has("password")) {
    throw new LoginFlagError("`--method email-code` cannot be combined with `--password`.");
  }
}

async function resolveLoginCompany(
  companies: Company[],
  options: Pick<LoginFlagOptions, "companyId" | "companyName">,
  askChoiceFn: typeof askChoice,
): Promise<Company> {
  const companyId = options.companyId?.trim();
  if (companyId) {
    const match = companies.find((company) => company.id === companyId);
    if (!match) {
      throw new LoginFlagError(`No authenticated company matched \`--company-id\` value "${companyId}".`);
    }

    console.log(`Using company: ${match.name ?? match.id}`);
    return match;
  }

  const companyName = options.companyName?.trim();
  if (companyName) {
    const matches = companies.filter((company) => company.name === companyName);

    if (matches.length === 0) {
      throw new LoginFlagError(`No authenticated company matched \`--company-name\` value "${companyName}".`);
    }

    if (matches.length > 1) {
      throw new LoginFlagError(
        `Multiple authenticated companies matched \`--company-name\` value "${companyName}". Use \`--company-id\` instead.`,
      );
    }

    console.log(`Using company: ${matches[0].name ?? matches[0].id}`);
    return matches[0];
  }

  return await selectCompany(companies, askChoiceFn);
}

function normalizeLoginMethod(value: string | null): HybridLoginMethod | null {
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

  throw new LoginFlagError("Invalid value for `--method`. Use `email-password`, `email-code`, or `google`.");
}

function normalizeAccessMode(value: string | null): boolean | null {
  if (value === null) return null;

  const normalized = value.trim().toLowerCase();

  if (normalized === "read-only") {
    return true;
  }

  if (normalized === "full-access") {
    return false;
  }

  throw new LoginFlagError("Invalid value for `--access-mode`. Use `read-only` or `full-access`.");
}

function readStringFlag(flags: Map<string, unknown[]>, name: string): string | null {
  const value = flags.get(name)?.at(-1);

  if (value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  throw new LoginFlagError(`Flag \`--${name}\` requires a value.`);
}
