import { callEndpoint, ApiError } from "../core/http";
import { readConfig, resolveRuntimeOptions } from "../core/config";
import { printError, printJson, writeJsonFile } from "../core/output";
import type { GlobalFlags } from "../core/parser";
import type { CatalogEndpoint } from "../types/catalog";

interface EndpointExecutionInput {
  endpoint: CatalogEndpoint;
  globalFlags: GlobalFlags;
  endpointInputs: Record<string, unknown>;
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

function formatApiError(error: ApiError): string {
  const payload = typeof error.payload === "string" ? error.payload : JSON.stringify(error.payload);
  return `API request failed (${error.status}): ${payload}`;
}
