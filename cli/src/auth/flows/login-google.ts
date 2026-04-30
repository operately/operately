import { callInternalMutation, callInternalQuery } from "../../core/internal-api";
import { cliAuth, openExternalUrl } from "../shared/api";
import { sleep } from "../shared/errors";
import type { Company } from "../types";

interface GoogleFlowDeps {
  callInternalMutation: typeof callInternalMutation;
  callInternalQuery: typeof callInternalQuery;
  openUrl: (url: string) => Promise<import("child_process").ChildProcess | boolean | undefined>;
}

export async function runGoogleFlow(
  baseUrl: string,
  deps: GoogleFlowDeps,
  inviteToken?: string,
): Promise<{ bootstrapToken: string; companies: Company[] }> {
  const payload: Record<string, unknown> = {};
  if (inviteToken) payload.invite_token = inviteToken;

  const response = (await deps.callInternalMutation(baseUrl, cliAuth.startGoogle, payload)) as {
    status: string;
    bootstrap_token: string;
    login_url: string;
    poll_interval_ms: number;
  };

  console.log(`\nPlease sign in via Google:`);
  console.log(`  ${response.login_url}\n`);

  try {
    await deps.openUrl(response.login_url);
    console.log("Browser opened automatically.\n");
  } catch {
    console.log("Could not open browser automatically. Please open the URL manually.\n");
  }

  return await pollGoogleStatus(baseUrl, response.bootstrap_token, response.poll_interval_ms, deps);
}

async function pollGoogleStatus(
  baseUrl: string,
  bootstrapToken: string,
  pollIntervalMs: number,
  deps: Pick<GoogleFlowDeps, "callInternalQuery">,
): Promise<{ bootstrapToken: string; companies: Company[] }> {
  const maxAttempts = 120;
  let attempts = 0;

  while (attempts < maxAttempts) {
    await sleep(pollIntervalMs);
    attempts++;

    const status = (await deps.callInternalQuery(
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
