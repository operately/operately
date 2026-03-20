import { callEndpoint, ApiError } from "../core/http";
import {
  readConfig,
  resolveRuntimeOptions,
  saveProfile,
  writeConfig,
  type CliConfig,
  type RuntimeOptions,
} from "../core/config";
import { printError, printJson, printSuccess, writeJsonFile } from "../core/output";
import type { GlobalFlags } from "../core/parser";
import type { EndpointRegistry } from "./registry";
import type { CatalogEndpoint } from "../types/catalog";

interface EndpointExecutionInput {
  endpoint: CatalogEndpoint;
  globalFlags: GlobalFlags;
  endpointInputs: Record<string, unknown>;
}

interface AuthExecutionInput {
  action: "login" | "status" | "whoami" | "logout";
  flags: Map<string, unknown[]>;
  registry: EndpointRegistry;
}

export async function executeEndpointCommand(input: EndpointExecutionInput): Promise<number> {
  const config = readConfig();
  const runtime = resolveRuntimeOptions(config, {
    token: input.globalFlags.token ?? null,
    baseUrl: input.globalFlags.baseUrl ?? null,
    profile: input.globalFlags.profile ?? null,
  });

  if (!runtime.token) {
    printError("Missing API token. Use `operately auth login --token <token>` or set OPERATELY_API_TOKEN.");
    return 3;
  }

  try {
    const payload = await callEndpoint({
      endpoint: input.endpoint,
      baseUrl: runtime.baseUrl,
      token: runtime.token,
      timeoutMs: runtime.timeoutMs,
      inputs: input.endpointInputs,
      verbose: input.globalFlags.verbose,
    });

    if (input.globalFlags.output) {
      writeJsonFile(input.globalFlags.output, payload, input.globalFlags.compact);
      return 0;
    }

    printJson(payload, input.globalFlags.compact);
    return 0;
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status >= 500 || error.status === 0) {
        printError(error.message);
        return 5;
      }

      printError(formatApiError(error));
      return 4;
    }

    printError("Unexpected error while executing command.");
    return 5;
  }
}

export async function executeAuthCommand(input: AuthExecutionInput): Promise<number> {
  const config = readConfig();

  if (input.action === "login") {
    return executeAuthLogin(input.flags, config, input.registry);
  }

  if (input.action === "status") {
    return executeAuthStatus(input.flags, config);
  }

  if (input.action === "logout") {
    return executeAuthLogout(input.flags, config);
  }

  return executeAuthWhoami(input.flags, config, input.registry);
}

async function executeAuthLogin(
  flags: Map<string, unknown[]>,
  config: CliConfig,
  registry: EndpointRegistry,
): Promise<number> {
  const token = readStringFlag(flags, "token");
  if (!token) {
    printError("Missing --token for auth login.");
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
    const payload = await callEndpoint({
      endpoint: getMe,
      baseUrl: runtime.baseUrl,
      token: runtime.token,
      inputs: {},
      timeoutMs: runtime.timeoutMs,
      verbose: false,
    });

    const updated = saveProfile(config, profile, {
      token,
      baseUrl: baseUrl ?? undefined,
    });
    writeConfig(updated);

    const user = payload as { me?: { full_name?: string; email?: string } };
    const userName = user.me?.full_name || user.me?.email;
    const displayUrl = updated.profiles[profile]?.baseUrl || runtime.baseUrl;

    printSuccess(`✓ Logged in to ${displayUrl} ${userName ? `as ${userName}` : ""}`);
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

  printJson(
    {
      profile: runtime.profile,
      token_configured: Boolean(runtime.token),
      base_url: runtime.baseUrl,
      profile_base_url: profileData.baseUrl ?? null,
    },
    false,
  );

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

    printJson(payload, false);
    return 0;
  } catch (error) {
    if (error instanceof ApiError) {
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
