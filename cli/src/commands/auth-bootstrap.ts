import {
  resolveRuntimeOptions,
  saveProfile,
  writeConfig,
  DEFAULT_BASE_URL,
  type CliConfig,
} from "../core/config";
import { printError, printSuccess } from "../core/output";
import { callInternalMutation, callInternalQuery } from "../core/internal-api";
import { askQuestion, askChoice, askPassword, PromptCancelledError } from "../core/prompts";
import { callEndpoint, ApiError } from "../core/http";
import { cliAuth } from "../core/paths";
import type { EndpointRegistry } from "./registry";

interface Company {
  id: string;
  name?: string;
}

interface BootstrapDeps {
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

import type { ChildProcess } from "child_process";

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
      return await runTokenFlow(runtime.baseUrl, runtime.timeoutMs, baseUrl ?? null, profile, config, registry, d);
    }

    let bootstrapToken: string;
    let companies: Company[];

    if (method === "password") {
      const result = await runPasswordFlow(runtime.baseUrl, d);
      bootstrapToken = result.bootstrapToken;
      companies = result.companies;
    } else {
      const result = await runGoogleFlow(runtime.baseUrl, d);
      bootstrapToken = result.bootstrapToken;
      companies = result.companies;
    }

    if (companies.length === 0) {
      d.printError("No companies found for this account.");
      d.printError("Please join or create a company first.");
      return 1;
    }

    const company = await selectCompany(companies, d);

    const readOnly = await d.askChoice<boolean>("Select access mode:", [
      { label: "Read-only", value: true },
      { label: "Full access", value: false },
    ]);

    const tokenResult = (await d.callInternalMutation(
      runtime.baseUrl,
      cliAuth.createToken,
      { company_id: company.id, read_only: readOnly },
      bootstrapToken,
    )) as { token: string; company: Company };

    const updated = d.saveProfile(config, profile, {
      token: tokenResult.token,
      baseUrl: baseUrl ?? undefined,
    });
    d.writeConfig(updated);

    const getMe = registry.find(["people", "get_me"]);
    if (getMe) {
      const payload = await d.callEndpoint({
        endpoint: getMe,
        baseUrl: runtime.baseUrl,
        token: tokenResult.token,
        inputs: {},
        timeoutMs: runtime.timeoutMs,
        verbose: false,
      });
      const user = payload as { me?: { full_name?: string; email?: string } };
      const userName = user.me?.full_name || user.me?.email;
      const displayUrl = updated.profiles[profile]?.baseUrl || runtime.baseUrl;
      d.printSuccess(`Logged in to ${displayUrl} ${userName ? `as ${userName}` : ""}`);
    } else {
      d.printSuccess("Authentication successful.");
    }

    return 0;
  } catch (error) {
    return handleBootstrapError(error, runtimeBaseUrl, d.printError);
  }
}

async function runPasswordFlow(
  baseUrl: string,
  d: BootstrapDeps,
): Promise<{ bootstrapToken: string; companies: Company[] }> {
  const email = await d.askQuestion("Email:");
  const password = await d.askPassword("Password:");

  const response = (await d.callInternalMutation(baseUrl, cliAuth.authPassword, {
    email,
    password,
  })) as {
    status: string;
    companies: Company[];
    bootstrap_token?: string;
    message?: string;
  };

  if (response.status === "no_companies") {
    return { bootstrapToken: "", companies: [] };
  }

  if (!response.bootstrap_token) {
    throw new Error("Authentication failed: no bootstrap token returned");
  }

  return { bootstrapToken: response.bootstrap_token, companies: response.companies ?? [] };
}

async function runTokenFlow(
  apiBaseUrl: string,
  timeoutMs: number,
  explicitBaseUrl: string | null,
  profile: string,
  config: CliConfig,
  registry: EndpointRegistry,
  d: BootstrapDeps,
): Promise<number> {
  const token = await d.askQuestion("API token:");

  const getMe = registry.find(["people", "get_me"]);
  if (!getMe) {
    d.printError("Cannot validate token: get_me endpoint not found in registry.");
    return 5;
  }

  try {
    const payload = await d.callEndpoint({
      endpoint: getMe,
      baseUrl: apiBaseUrl,
      token: token,
      inputs: {},
      timeoutMs,
      verbose: false,
    });
    const user = payload as { me?: { full_name?: string; email?: string } };
    const userName = user.me?.full_name || user.me?.email;

    const baseUrlToSave = explicitBaseUrl === null || explicitBaseUrl === DEFAULT_BASE_URL ? undefined : explicitBaseUrl;
    const updated = d.saveProfile(config, profile, {
      token: token,
      baseUrl: baseUrlToSave,
    });
    d.writeConfig(updated);

    d.printSuccess(`Logged in to ${apiBaseUrl} ${userName ? `as ${userName}` : ""}`);
    return 0;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      d.printError("Invalid token. Please check your token and try again.");
      return 4;
    }
    return handleBootstrapError(error, apiBaseUrl, d.printError);
  }
}

async function runGoogleFlow(
  baseUrl: string,
  d: BootstrapDeps,
): Promise<{ bootstrapToken: string; companies: Company[] }> {
  const response = (await d.callInternalMutation(baseUrl, cliAuth.startGoogle, {})) as {
    status: string;
    bootstrap_token: string;
    login_url: string;
    poll_interval_ms: number;
  };

  console.log(`\nPlease sign in via Google:`);
  console.log(`  ${response.login_url}\n`);

  try {
    await d.openUrl(response.login_url);
    console.log("Browser opened automatically.\n");
  } catch {
    console.log("Could not open browser automatically. Please open the URL manually.\n");
  }

  return await pollGoogleStatus(baseUrl, response.bootstrap_token, response.poll_interval_ms, d);
}

async function pollGoogleStatus(
  baseUrl: string,
  bootstrapToken: string,
  pollIntervalMs: number,
  d: BootstrapDeps,
): Promise<{ bootstrapToken: string; companies: Company[] }> {
  const maxAttempts = 120; // 10 minutes at 5-second default
  let attempts = 0;

  while (attempts < maxAttempts) {
    await sleep(pollIntervalMs);
    attempts++;

    const status = (await d.callInternalQuery(
      baseUrl,
      cliAuth.status,
      {},
      bootstrapToken,
    )) as {
      status: string;
      companies?: Company[];
      message?: string;
    };

    if (status.status === "authenticated") {
      return { bootstrapToken, companies: status.companies ?? [] };
    }

    if (status.status === "no_companies") {
      return { bootstrapToken, companies: [] };
    }

    if (status.status === "expired") {
      throw new Error("Authentication session expired. Please try again.");
    }

    if (attempts % 5 === 0) {
      console.log("Waiting for browser authentication...");
    }
  }

  throw new Error("Authentication timed out. Please try again.");
}

async function selectCompany(companies: Company[], d: BootstrapDeps): Promise<Company> {
  if (companies.length === 1) {
    console.log(`Using company: ${companies[0].name ?? companies[0].id}`);
    return companies[0];
  }

  return await d.askChoice<Company>(
    "Select a company:",
    companies.map((c) => ({ label: c.name ?? c.id, value: c })),
  );
}

function handleBootstrapError(error: unknown, baseUrl: string, printErrorFn: typeof printError): number {
  if (error instanceof PromptCancelledError) {
    printErrorFn("Authentication cancelled.");
    return 1;
  }

  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      printErrorFn(`Authentication failed: Invalid credentials for ${baseUrl}`);
      return 4;
    }

    if (error.status >= 500 || error.status === 0) {
      printErrorFn(`Authentication failed: Unable to connect to ${baseUrl}`);
      printErrorFn("The server is not responding.");
      return 5;
    }

    const payload = typeof error.payload === "string" ? error.payload : JSON.stringify(error.payload);
    printErrorFn(`Authentication failed for ${baseUrl}: ${payload}`);
    return 4;
  }

  if (error instanceof Error) {
    printErrorFn(error.message);
    return 4;
  }

  printErrorFn("Unexpected error during authentication.");
  return 5;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function openExternalUrl(url: string): Promise<ChildProcess | boolean | undefined> {
  const openModule = (await importModule("open")) as {
    default: (target: string) => Promise<ChildProcess | boolean | undefined>;
  };

  return openModule.default(url);
}

const importModule = new Function("specifier", "return import(specifier)") as (
  specifier: string,
) => Promise<unknown>;

function readStringFlag(flags: Map<string, unknown[]>, name: string): string | null {
  const value = flags.get(name)?.at(-1);
  if (typeof value === "string") return value;
  return null;
}
