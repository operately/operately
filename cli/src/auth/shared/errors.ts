import { ApiError } from "../../core/http";
import { printError } from "../../core/output";
import { PromptCancelledError } from "../../core/prompts";

export function handleBootstrapError(error: unknown, baseUrl: string, printErrorFn: typeof printError): number {
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

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
