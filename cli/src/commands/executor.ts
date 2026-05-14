import { callEndpoint, ApiError } from "../core/http";
import { readConfig, resolveRuntimeOptions } from "../auth/config";
import { printError, printJson, writeJsonFile } from "../core/output";
import { UsageError, type GlobalFlags } from "../core/parser";
import { executeCustomEndpointCommand } from "./custom-endpoints";
import type { CatalogEndpoint } from "../types/catalog";
import type { EndpointRegistry } from "./registry";

interface EndpointExecutionInput {
  endpoint: CatalogEndpoint;
  globalFlags: GlobalFlags;
  endpointInputs: Record<string, unknown>;
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
    const payload =
      input.endpoint.execution_mode === "custom"
        ? await executeCustomEndpointCommand({
            endpoint: input.endpoint,
            endpointInputs: input.endpointInputs,
            registry: input.registry,
            runtime: {
              baseUrl: runtime.baseUrl,
              token: runtime.token,
              timeoutMs: runtime.timeoutMs,
            },
            globalFlags: input.globalFlags,
          })
        : await callEndpoint({
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
    if (error instanceof UsageError) {
      printError(error.message);
      return 2;
    }

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
