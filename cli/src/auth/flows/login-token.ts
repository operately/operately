import { askQuestion } from "../../core/prompts";
import { callEndpoint, ApiError } from "../../core/http";
import { saveProfile, writeConfig, DEFAULT_BASE_URL, type CliConfig } from "../config";
import { handleBootstrapError } from "../shared/errors";
import { fetchProfileMetadata } from "../shared/profile-metadata";
import type { EndpointRegistry } from "../../commands/registry";

interface TokenFlowDeps {
  askQuestion: typeof askQuestion;
  callEndpoint: typeof callEndpoint;
  saveProfile: typeof saveProfile;
  writeConfig: typeof writeConfig;
  printError: (message: string) => void;
  printSuccess: (message: string) => void;
}

export async function runTokenFlow(
  apiBaseUrl: string,
  timeoutMs: number,
  explicitBaseUrl: string | null,
  profile: string,
  config: CliConfig,
  registry: EndpointRegistry,
  deps: TokenFlowDeps,
): Promise<number> {
  const token = (await deps.askQuestion("API token:")).trim();
  const getMe = registry.find(["people", "get_me"]);

  if (!getMe) {
    deps.printError("Cannot validate token: get_me endpoint not found in registry.");
    return 5;
  }

  try {
    const metadata = await fetchProfileMetadata({
      registry,
      callEndpoint: deps.callEndpoint,
      baseUrl: apiBaseUrl,
      token,
      timeoutMs,
    });

    const baseUrlToSave = explicitBaseUrl === null || explicitBaseUrl === DEFAULT_BASE_URL ? undefined : explicitBaseUrl;
    const updated = deps.saveProfile(config, profile, {
      token,
      baseUrl: baseUrlToSave,
      name: metadata.name,
      companyName: metadata.companyName,
    });
    deps.writeConfig(updated);

    deps.printSuccess(`Logged in to ${apiBaseUrl} ${metadata.name ? `as ${metadata.name}` : ""}`);
    return 0;
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      deps.printError("Invalid token. Please check your token and try again.");
      return 4;
    }
    return handleBootstrapError(error, apiBaseUrl, deps.printError);
  }
}
