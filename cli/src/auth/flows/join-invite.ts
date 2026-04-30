import {
  resolveRuntimeOptions,
  saveProfile,
  writeConfig,
  DEFAULT_BASE_URL,
  type CliConfig,
} from "../config";
import { printError, printInfo, printSuccess } from "../../core/output";
import { callInternalMutation, callInternalQuery } from "../../core/internal-api";
import { askQuestion, askPassword, askChoice } from "../../core/prompts";
import { callEndpoint } from "../../core/http";
import { cliAuth, publicQuery } from "../shared/api";
import { selectCompany } from "../shared/company-selection";
import { createTokenAndSaveProfile } from "../shared/token-creation";
import { runPasswordFlow } from "./login-password";
import { runGoogleFlow } from "./login-google";
import { openExternalUrl } from "../shared/api";
import { handleBootstrapError } from "../shared/errors";
import type { EndpointRegistry } from "../../commands/registry";
import type { Company } from "../types";
import type { ChildProcess } from "child_process";

interface JoinInviteFlowDeps {
  askQuestion: typeof askQuestion;
  askPassword: typeof askPassword;
  askChoice: typeof askChoice;
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

const defaultDeps: JoinInviteFlowDeps = {
  askQuestion,
  askPassword,
  askChoice,
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

export async function runJoinInviteFlow(
  flags: Map<string, unknown[]>,
  config: CliConfig,
  registry: EndpointRegistry,
  deps: Partial<JoinInviteFlowDeps> = {},
): Promise<number> {
  const d = { ...defaultDeps, ...deps };

  let baseUrl = readStringFlag(flags, "base-url");
  let profile = readStringFlag(flags, "profile");
  let inviteToken = readStringFlag(flags, "invite-token");
  let runtimeBaseUrl = baseUrl ?? DEFAULT_BASE_URL;

  try {
    if (!inviteToken) {
      inviteToken = (await d.askQuestion("Invite token:")).trim();
    }

    if (!baseUrl) {
      const answer = await d.askQuestion(
        `Base URL for the Operately instance (default: ${DEFAULT_BASE_URL}):`,
      );
      baseUrl = answer.trim() || null;
    }

    if (!profile) {
      const answer = await d.askQuestion(`Profile name (default: default):`);
      profile = answer.trim() || "default";
    }

    const runtime = d.resolveRuntimeOptions(config, {
      token: null,
      baseUrl: baseUrl ?? null,
      profile: null,
    });
    runtimeBaseUrl = runtime.baseUrl;

    const inviteResult = (await d.callInternalQuery(
      runtime.baseUrl,
      publicQuery.getInviteLinkByToken,
      { token: inviteToken },
    )) as { invite_link?: { type: string; company?: { name?: string } } | null };

    if (!inviteResult.invite_link) {
      d.printError("Invalid or expired invite token.");
      return 1;
    }

    const linkType = inviteResult.invite_link.type;

    if (linkType === "personal") {
      return await handlePersonalInvite(runtime.baseUrl, inviteToken, runtime.timeoutMs, baseUrl, profile, config, registry, d);
    }

    return await handleCompanyWideInvite(
      runtime.baseUrl,
      inviteToken,
      runtime.timeoutMs,
      baseUrl,
      profile,
      config,
      registry,
      d,
      inviteResult.invite_link.company as Company | undefined,
    );
  } catch (error) {
    return handleBootstrapError(error, runtimeBaseUrl, d.printError);
  }
}

async function handlePersonalInvite(
  baseUrl: string,
  inviteToken: string,
  timeoutMs: number,
  explicitBaseUrl: string | null,
  profile: string,
  config: CliConfig,
  registry: EndpointRegistry,
  d: JoinInviteFlowDeps,
): Promise<number> {
  const invitation = (await d.callInternalQuery(
    baseUrl,
    "/invitations/get_invitation",
    { token: inviteToken },
  )) as {
    invite_link: { company: Company };
    member: { email: string };
  };

  const memberEmail = invitation.member.email;

  d.printInfo(`\nJoining as ${memberEmail}`);
  const method = await d.askChoice<"password" | "google">("How would you like to sign in?", [
    { label: "Email and password", value: "password" },
    { label: "Google OAuth (opens browser)", value: "google" },
  ]);

  let bootstrapToken: string;

  if (method === "password") {
    const isFirstTime = await d.askChoice<boolean>("Is this your first time logging in?", [
      { label: "Yes", value: true },
      { label: "No", value: false },
    ]);

    if (isFirstTime) {
      const password = await d.askPassword("Password:");
      const passwordConfirmation = await d.askPassword("Confirm password:");

      const response = (await d.callInternalMutation(baseUrl, cliAuth.joinCompany, {
        token: inviteToken,
        password,
        password_confirmation: passwordConfirmation,
      })) as {
        status: string;
        bootstrap_token?: string;
      };

      if (!response.bootstrap_token) {
        d.printError("Failed to join company: no bootstrap token returned.");
        return 1;
      }

      bootstrapToken = response.bootstrap_token;
    } else {
      const result = await runPasswordFlow(baseUrl, {
        askQuestion: d.askQuestion,
        askPassword: d.askPassword,
        callInternalMutation: d.callInternalMutation,
      }, inviteToken);

      if (!result.bootstrapToken) {
        d.printError("Authentication failed: no bootstrap token returned.");
        return 1;
      }

      bootstrapToken = result.bootstrapToken;
    }
  } else {
    const result = await runGoogleFlow(baseUrl, {
      callInternalMutation: d.callInternalMutation,
      callInternalQuery: d.callInternalQuery,
      openUrl: d.openUrl,
    }, inviteToken);
    bootstrapToken = result.bootstrapToken;
  }

  return await createTokenAndSaveProfile({
    baseUrl: explicitBaseUrl,
    profile,
    config,
    runtimeBaseUrl: baseUrl,
    bootstrapToken,
    company: invitation.invite_link.company,
    readOnly: false,
    timeoutMs,
    registry,
    callInternalMutation: d.callInternalMutation,
    callEndpoint: d.callEndpoint,
    printError: d.printError,
    printSuccess: d.printSuccess,
    saveProfile: d.saveProfile,
    writeConfig: d.writeConfig,
  });
}

async function handleCompanyWideInvite(
  baseUrl: string,
  inviteToken: string,
  timeoutMs: number,
  explicitBaseUrl: string | null,
  profile: string,
  config: CliConfig,
  registry: EndpointRegistry,
  d: JoinInviteFlowDeps,
  invitedCompany?: Company,
): Promise<number> {
  const method = await d.askChoice<"password" | "google">("How would you like to sign in?", [
    { label: "Email and password", value: "password" },
    { label: "Google OAuth (opens browser)", value: "google" },
  ]);

  let bootstrapToken: string;
  let companies: Company[];

  if (method === "password") {
    const result = await runPasswordFlow(baseUrl, {
      askQuestion: d.askQuestion,
      askPassword: d.askPassword,
      callInternalMutation: d.callInternalMutation,
    }, inviteToken);
    bootstrapToken = result.bootstrapToken;
    companies = result.companies;
  } else {
    const result = await runGoogleFlow(baseUrl, {
      callInternalMutation: d.callInternalMutation,
      callInternalQuery: d.callInternalQuery,
      openUrl: d.openUrl,
    }, inviteToken);
    bootstrapToken = result.bootstrapToken;
    companies = result.companies;
  }

  if (companies.length === 0) {
    d.printError("No companies found after joining. Please try again.");
    return 1;
  }

  const company = invitedCompany ?? (await selectCompany(companies, d.askChoice));

  return await createTokenAndSaveProfile({
    baseUrl: explicitBaseUrl,
    profile,
    config,
    runtimeBaseUrl: baseUrl,
    bootstrapToken,
    company,
    readOnly: false,
    timeoutMs,
    registry,
    callInternalMutation: d.callInternalMutation,
    callEndpoint: d.callEndpoint,
    printError: d.printError,
    printSuccess: d.printSuccess,
    saveProfile: d.saveProfile,
    writeConfig: d.writeConfig,
  });
}

function readStringFlag(flags: Map<string, unknown[]>, name: string): string | null {
  const value = flags.get(name)?.at(-1);
  if (typeof value === "string") return value;
  return null;
}
