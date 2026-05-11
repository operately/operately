import { callEndpoint, ApiError } from "../core/http";
import {
  readConfig,
  resolveRuntimeOptions,
  saveProfile,
  writeConfig,
  type CliConfig,
  type RuntimeOptions,
} from "./config";
import { printError, printSuccess } from "../core/output";
import { executeAuthBootstrap } from "./bootstrap";
import { runSignupFlow } from "./flows/signup";
import { runJoinInviteFlow } from "./flows/join-invite";
import { runCreateCompanyFlow } from "./flows/create-company";
import { executeAuthProfiles } from "./profiles";
import { fetchProfileMetadata } from "./shared/profile-metadata";
import type { AuthAction } from "../core/parser-types";
import type { EndpointRegistry } from "../commands/registry";

interface AuthExecutionInput {
  action: AuthAction;
  flags: Map<string, unknown[]>;
  registry: EndpointRegistry;
}

export async function executeAuthCommand(input: AuthExecutionInput): Promise<number> {
  const config = readConfig();

  if (input.action === "login") {
    return executeAuthLogin(input.flags, config, input.registry);
  }

  if (input.action === "signup") {
    return executeAuthSignup(input.flags, config, input.registry);
  }

  if (input.action === "join") {
    return executeAuthJoin(input.flags, config, input.registry);
  }

  if (input.action === "create-company") {
    return executeAuthCreateCompany(input.flags, config, input.registry);
  }

  if (input.action === "status") {
    return executeAuthStatus(input.flags, config);
  }

  if (input.action === "profiles") {
    return executeAuthProfiles(config);
  }

  if (input.action === "logout") {
    return executeAuthLogout(input.flags, config);
  }

  return executeAuthWhoami(input.flags, config, input.registry);
}

async function executeAuthSignup(
  flags: Map<string, unknown[]>,
  config: CliConfig,
  registry: EndpointRegistry,
): Promise<number> {
  return runSignupFlow(flags, config, registry);
}

async function executeAuthJoin(
  flags: Map<string, unknown[]>,
  config: CliConfig,
  registry: EndpointRegistry,
): Promise<number> {
  return runJoinInviteFlow(flags, config, registry);
}

async function executeAuthCreateCompany(
  flags: Map<string, unknown[]>,
  config: CliConfig,
  registry: EndpointRegistry,
): Promise<number> {
  return runCreateCompanyFlow(flags, config, registry);
}

async function executeAuthLogin(
  flags: Map<string, unknown[]>,
  config: CliConfig,
  registry: EndpointRegistry,
): Promise<number> {
  const token = readStringFlag(flags, "token");
  if (!token) {
    return executeAuthBootstrap(flags, config, registry);
  }

  const hybridOnlyFlags = ["method", "email", "password", "company-id", "company-name", "access-mode"];
  const conflictingFlags = hybridOnlyFlags.filter((name) => flags.has(name));

  if (conflictingFlags.length > 0) {
    const formatted = conflictingFlags.map((name) => `\`--${name}\``).join(", ");
    printError(`\`--token\` cannot be combined with ${formatted}.`);
    return 2;
  }

  const baseUrl = readStringFlag(flags, "base-url");
  const profile = readStringFlag(flags, "profile") ?? config.activeProfile ?? "default";
  const getMe = registry.find(["people", "get_me"]);

  if (!getMe) {
    printError("Endpoint 'people/get_me' is not present in the API catalog.");
    return 2;
  }

  const runtime = resolveRuntimeOptions(config, {
    token,
    baseUrl: baseUrl ?? null,
    profile: null,
  });

  if (!runtime.token) {
    printError("Authentication failed: Token is required");
    return 2;
  }

  try {
    const metadata = await fetchProfileMetadata({
      registry,
      callEndpoint,
      baseUrl: runtime.baseUrl,
      token: runtime.token,
      timeoutMs: runtime.timeoutMs,
    });

    const updated = saveProfile(config, profile, {
      token,
      baseUrl: baseUrl ?? undefined,
      name: metadata.name,
      companyName: metadata.companyName,
    });
    writeConfig(updated);

    const displayUrl = updated.profiles[profile]?.baseUrl || runtime.baseUrl;

    printSuccess(`✓ Logged in to ${displayUrl} ${metadata.name ? `as ${metadata.name}` : ""}`);
    return 0;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        printError(`Authentication failed: Invalid token for ${runtime.baseUrl}`);
        printError("Please check your token and try again.");
        return 4;
      }

      if (error.status >= 500 || error.status === 0) {
        printError(`Authentication failed: Unable to connect to ${runtime.baseUrl}`);
        printError("The server is not responding.");
        return 5;
      }

      printError(`Authentication failed for ${runtime.baseUrl}: ${formatApiError(error)}`);
      return 4;
    }

    printError(`Authentication failed for ${runtime.baseUrl}: Unexpected error occurred`);
    return 5;
  }
}

function executeAuthStatus(flags: Map<string, unknown[]>, config: CliConfig): number {
  const runtime = runtimeFromAuthFlags(flags, config);
  const profileData = config.profiles[runtime.profile] ?? {};

  console.log(`Profile: ${runtime.profile}`);
  console.log(`Status: ${runtime.token ? "Logged in" : "Not logged in"}`);
  if (runtime.token && profileData.name) {
    console.log(`Name: ${profileData.name}`);
  }
  if (runtime.token && profileData.companyName) {
    console.log(`Company: ${profileData.companyName}`);
  }
  console.log(`Base URL: ${runtime.baseUrl}`);

  if (profileData.baseUrl && profileData.baseUrl !== runtime.baseUrl) {
    console.log(`Profile Base URL: ${profileData.baseUrl}`);
  }

  return 0;
}

function executeAuthLogout(flags: Map<string, unknown[]>, config: CliConfig): number {
  const profile = readStringFlag(flags, "profile") ?? config.activeProfile ?? "default";
  const existing = config.profiles[profile] ?? {};

  if (!existing.token) {
    printError(`Not logged in to profile '${profile}'`);
    return 1;
  }

  const updated = saveProfile(config, profile, {
    ...existing,
    token: "",
    name: undefined,
    companyName: undefined,
  });
  writeConfig(updated);
  printSuccess(`✓ Logged out from profile '${profile}'`);
  return 0;
}

async function executeAuthWhoami(
  flags: Map<string, unknown[]>,
  config: CliConfig,
  registry: EndpointRegistry,
): Promise<number> {
  const getMe = registry.find(["people", "get_me"]);
  if (!getMe) {
    printError("Endpoint 'people/get_me' is not present in the API catalog.");
    return 2;
  }

  const runtime = runtimeFromAuthFlags(flags, config);
  if (!runtime.token) {
    printError("Missing API token. Use `operately auth login --token <token>`.");
    return 3;
  }

  try {
    const payload = await callEndpoint({
      endpoint: getMe,
      baseUrl: runtime.baseUrl,
      token: runtime.token,
      inputs: {},
      timeoutMs: runtime.timeoutMs,
      verbose: false,
    });

    const user = payload as { me?: { full_name?: string; email?: string; title?: string } };
    const name = user.me?.full_name || user.me?.email || "Unknown";
    const email = user.me?.email;
    const title = user.me?.title;

    console.log(`Logged in to ${runtime.baseUrl} as ${name}`);
    if (email && user.me?.full_name) {
      console.log(`Email: ${email}`);
    }
    if (title) {
      console.log(`Title: ${title}`);
    }
    console.log(`Profile: ${runtime.profile}`);

    return 0;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 401 || error.status === 403) {
        printError("Authentication failed: Invalid or expired token");
        printError("Please login again with `operately auth login --token <token>`");
        return 4;
      }

      printError(formatApiError(error));
      return error.status >= 500 || error.status === 0 ? 5 : 4;
    }

    printError("Unexpected error while running auth whoami.");
    return 5;
  }
}

function runtimeFromAuthFlags(flags: Map<string, unknown[]>, config: CliConfig): RuntimeOptions {
  return resolveRuntimeOptions(config, {
    token: readStringFlag(flags, "token") ?? null,
    baseUrl: readStringFlag(flags, "base-url") ?? null,
    profile: readStringFlag(flags, "profile") ?? null,
  });
}

function readStringFlag(flags: Map<string, unknown[]>, name: string): string | null {
  const value = flags.get(name)?.at(-1);
  if (typeof value === "string") return value;
  return null;
}

function formatApiError(error: ApiError): string {
  const payload = typeof error.payload === "string" ? error.payload : JSON.stringify(error.payload);
  return `API request failed (${error.status}): ${payload}`;
}
