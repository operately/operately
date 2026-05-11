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
import { runEmailCodeFlow } from "./login-email-code";
import { runPasswordFlow } from "./login-password";
import { runGoogleFlow } from "./login-google";
import { openExternalUrl } from "../shared/api";
import { handleBootstrapError } from "../shared/errors";
import { resolveProfileName } from "../shared/helpers";
import type { EndpointRegistry } from "../../commands/registry";
import type { Company } from "../types";
import type { ChildProcess } from "child_process";

type JoinMethod = "password" | "emailCode" | "google";

interface JoinFlagOptions {
  inviteToken: string | null;
  baseUrl: string | null;
  profile: string | null;
  method: JoinMethod | null;
  email: string | null;
  password: string | null;
  companyId: string | null;
  companyName: string | null;
}

class JoinFlagError extends Error {}

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

  let options: JoinFlagOptions;
  let baseUrl: string | null = null;
  let profile: string | null = null;
  let inviteToken: string | null = null;
  let runtimeBaseUrl = baseUrl ?? DEFAULT_BASE_URL;

  try {
    options = parseJoinFlagOptions(flags);
    validateJoinFlagOptions(flags, options);

    baseUrl = options.baseUrl;
    runtimeBaseUrl = baseUrl ?? DEFAULT_BASE_URL;
    profile = options.profile;
    inviteToken = options.inviteToken;
    if (!inviteToken) {
      inviteToken = (await d.askQuestion("Invite token:")).trim();
    } else {
      inviteToken = inviteToken.trim();
    }

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
      return await handlePersonalInvite(runtime.baseUrl, inviteToken, runtime.timeoutMs, baseUrl, profile, config, registry, d, options);
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
      options,
    );
  } catch (error) {
    if (error instanceof JoinFlagError) {
      d.printError(error.message);
      return 2;
    }

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
  options: JoinFlagOptions,
): Promise<number> {
  const invitation = (await d.callInternalQuery(
    baseUrl,
    "/invitations/get_invitation",
    { token: inviteToken },
  )) as {
    invite_link: { company: Company };
    member: { email: string; has_open_invitation?: boolean | null };
  };

  const memberEmail = invitation.member.email;
  const hasOpenInvitation = invitation.member.has_open_invitation === true;
  validatePersonalInviteEmail(memberEmail, options.email);

  d.printInfo(`\nJoining as ${memberEmail}`);
  let bootstrapToken: string;

  if (hasOpenInvitation) {
    if (options.method === "emailCode") {
      throw new JoinFlagError("`--method email-code` is not available for first-time personal invites.");
    }

    const method =
      options.method ??
      await d.askChoice<"password" | "google">("How would you like to sign in?", [
        { label: "Email and password", value: "password" },
        { label: "Google OAuth (opens browser)", value: "google" },
      ]);

    if (method === "password") {
      const password = options.password ?? await d.askPassword("Password:");
      const passwordConfirmation = options.password ?? await d.askPassword("Confirm password:");

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
      const result = await runGoogleFlow(baseUrl, {
        callInternalMutation: d.callInternalMutation,
        callInternalQuery: d.callInternalQuery,
        openUrl: d.openUrl,
      }, { inviteToken });
      bootstrapToken = result.bootstrapToken;
    }
  } else {
    const method =
      options.method ??
      await d.askChoice<"password" | "emailCode" | "google">("How would you like to sign in?", [
        { label: "Email and password", value: "password" },
        { label: "Email code (no password)", value: "emailCode" },
        { label: "Google OAuth (opens browser)", value: "google" },
      ]);

    if (method === "password") {
      const result = await runPasswordFlow(baseUrl, {
        askQuestion: d.askQuestion,
        askPassword: d.askPassword,
        callInternalMutation: d.callInternalMutation,
      }, {
        email: options.email ? memberEmail : undefined,
        password: options.password ?? undefined,
        inviteToken,
      });

      if (!result.bootstrapToken) {
        d.printError("Authentication failed: no bootstrap token returned.");
        return 1;
      }

      bootstrapToken = result.bootstrapToken;
    } else if (method === "emailCode") {
      const result = await runEmailCodeFlow(baseUrl, {
        askQuestion: d.askQuestion,
        callInternalMutation: d.callInternalMutation,
      }, {
        email: memberEmail,
        inviteToken,
      });

      bootstrapToken = result.bootstrapToken;
    } else {
      const result = await runGoogleFlow(baseUrl, {
        callInternalMutation: d.callInternalMutation,
        callInternalQuery: d.callInternalQuery,
        openUrl: d.openUrl,
      }, { inviteToken });
      bootstrapToken = result.bootstrapToken;
    }
  }

  const company = await resolveJoinCompany(
    invitation.invite_link.company,
    [invitation.invite_link.company],
    options,
    d.askChoice,
  );

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
  options?: JoinFlagOptions,
): Promise<number> {
  const method =
    options?.method ??
    await d.askChoice<"password" | "emailCode" | "google">("How would you like to sign in?", [
      { label: "Email and password", value: "password" },
      { label: "Email code (no password)", value: "emailCode" },
      { label: "Google OAuth (opens browser)", value: "google" },
    ]);

  let bootstrapToken: string;
  let companies: Company[];

  if (method === "password") {
    const result = await runPasswordFlow(baseUrl, {
      askQuestion: d.askQuestion,
      askPassword: d.askPassword,
      callInternalMutation: d.callInternalMutation,
    }, {
      email: options?.email ?? undefined,
      password: options?.password ?? undefined,
      inviteToken,
    });
    bootstrapToken = result.bootstrapToken;
    companies = result.companies;
  } else if (method === "emailCode") {
    const result = await runEmailCodeFlow(baseUrl, {
      askQuestion: d.askQuestion,
      callInternalMutation: d.callInternalMutation,
    }, {
      email: options?.email ?? undefined,
      inviteToken,
    });
    bootstrapToken = result.bootstrapToken;
    companies = result.companies;
  } else {
    const result = await runGoogleFlow(baseUrl, {
      callInternalMutation: d.callInternalMutation,
      callInternalQuery: d.callInternalQuery,
      openUrl: d.openUrl,
    }, { inviteToken });
    bootstrapToken = result.bootstrapToken;
    companies = result.companies;
  }

  if (companies.length === 0) {
    d.printError("No companies found after joining. Please try again.");
    return 1;
  }

  const company = await resolveJoinCompany(invitedCompany, companies, options ?? emptyJoinFlagOptions(), d.askChoice);

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

function parseJoinFlagOptions(flags: Map<string, unknown[]>): JoinFlagOptions {
  return {
    inviteToken: readStringFlag(flags, "invite-token"),
    baseUrl: readStringFlag(flags, "base-url"),
    profile: readStringFlag(flags, "profile"),
    method: normalizeJoinMethod(readStringFlag(flags, "method")),
    email: readStringFlag(flags, "email"),
    password: readStringFlag(flags, "password"),
    companyId: readStringFlag(flags, "company-id"),
    companyName: readStringFlag(flags, "company-name"),
  };
}

function validateJoinFlagOptions(
  flags: Map<string, unknown[]>,
  options: Pick<JoinFlagOptions, "method">,
): void {
  if (options.method === "google" && (flags.has("email") || flags.has("password"))) {
    throw new JoinFlagError("`--method google` cannot be combined with `--email` or `--password`.");
  }

  if (options.method === "emailCode" && flags.has("password")) {
    throw new JoinFlagError("`--method email-code` cannot be combined with `--password`.");
  }
}

function validatePersonalInviteEmail(memberEmail: string, email: string | null): void {
  if (email === null) {
    return;
  }

  if (email.trim().toLowerCase() !== memberEmail.trim().toLowerCase()) {
    throw new JoinFlagError("`--email` must match the invited email address for personal invites.");
  }
}

async function resolveJoinCompany(
  invitedCompany: Company | undefined,
  companies: Company[],
  options: Pick<JoinFlagOptions, "companyId" | "companyName">,
  askChoiceFn: typeof askChoice,
): Promise<Company> {
  const companyId = options.companyId?.trim();
  const companyName = options.companyName?.trim();

  if (invitedCompany?.id) {
    if (companyId && companyId !== invitedCompany.id) {
      throw new JoinFlagError("`--company-id` must match the invited company for this invite.");
    }

    if (companyName && companyName !== invitedCompany.name) {
      throw new JoinFlagError("`--company-name` must match the invited company for this invite.");
    }

    return invitedCompany;
  }

  if (companyId) {
    const match = companies.find((company) => company.id === companyId);
    if (!match) {
      throw new JoinFlagError(`No authenticated company matched \`--company-id\` value "${companyId}".`);
    }

    return match;
  }

  if (companyName) {
    const matches = companies.filter((company) => company.name === companyName);

    if (matches.length === 0) {
      throw new JoinFlagError(`No authenticated company matched \`--company-name\` value "${companyName}".`);
    }

    if (matches.length > 1) {
      throw new JoinFlagError(
        `Multiple authenticated companies matched \`--company-name\` value "${companyName}". Use \`--company-id\` instead.`,
      );
    }

    return matches[0];
  }

  return await selectCompany(companies, askChoiceFn);
}

function normalizeJoinMethod(value: string | null): JoinMethod | null {
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

  throw new JoinFlagError("Invalid value for `--method`. Use `email-password`, `email-code`, or `google`.");
}

function emptyJoinFlagOptions(): JoinFlagOptions {
  return {
    inviteToken: null,
    baseUrl: null,
    profile: null,
    method: null,
    email: null,
    password: null,
    companyId: null,
    companyName: null,
  };
}

function readStringFlag(flags: Map<string, unknown[]>, name: string): string | null {
  const value = flags.get(name)?.at(-1);

  if (value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  throw new JoinFlagError(`Flag \`--${name}\` requires a value.`);
}
