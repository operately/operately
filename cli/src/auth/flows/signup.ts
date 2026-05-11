import {
  resolveRuntimeOptions,
  saveProfile,
  writeConfig,
  DEFAULT_BASE_URL,
  type CliConfig,
} from "../config";
import { printError, printInfo, printSuccess } from "../../core/output";
import { callInternalMutation, callInternalQuery } from "../../core/internal-api";
import { askQuestion, askPassword, askChoice, PromptCancelledError } from "../../core/prompts";
import { callEndpoint, ApiError } from "../../core/http";
import { cliAuth, openExternalUrl } from "../shared/api";
import { createCompanyAndSaveProfile, resolveCompanyCreationMode } from "../shared/company-creation";
import { requireCompany, resolveProfileName } from "../shared/helpers";
import { createTokenAndSaveProfile } from "../shared/token-creation";
import { runGoogleFlow } from "./login-google";
import type { EndpointRegistry } from "../../commands/registry";
import type { Company, CompanyCreationMode } from "../types";
import type { ChildProcess } from "child_process";

type SignupMethod = "password" | "google";
type SignupNextStep = "create-company" | "join" | "later";

interface SignupFlagOptions {
  baseUrl: string | null;
  profile: string | null;
  method: SignupMethod | null;
  fullName: string | null;
  email: string | null;
  password: string | null;
  nextStep: SignupNextStep | null;
  companyName: string | null;
  inviteToken: string | null;
}

class SignupFlagError extends Error {}

interface SignupFlowDeps {
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
  resolveRuntimeOptions: typeof resolveRuntimeOptions;
}

const defaultDeps: SignupFlowDeps = {
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
  resolveRuntimeOptions,
};

export async function runSignupFlow(
  flags: Map<string, unknown[]>,
  config: CliConfig,
  registry: EndpointRegistry,
  deps: Partial<SignupFlowDeps> = {},
): Promise<number> {
  const d = { ...defaultDeps, ...deps };

  let options: SignupFlagOptions;
  let baseUrl: string | null = null;
  let profileFlag: string | null = null;
  let runtimeBaseUrl = baseUrl ?? DEFAULT_BASE_URL;
  let companyCreationMode: CompanyCreationMode = "create";

  try {
    options = parseSignupFlagOptions(flags);
    validateSignupFlagOptions(flags, options);

    baseUrl = options.baseUrl;
    profileFlag = options.profile;
    runtimeBaseUrl = baseUrl ?? DEFAULT_BASE_URL;

    const method =
      options.method ??
      await d.askChoice<SignupMethod>("How would you like to sign up?", [
        { label: "Email and password", value: "password" },
        { label: "Google OAuth (opens browser)", value: "google" },
      ]);

    if (!baseUrl) {
      const answer = await d.askQuestion(
        `Base URL for the Operately instance (default: ${DEFAULT_BASE_URL}):`,
      );
      baseUrl = answer.trim() || null;
    }

    const runtime = d.resolveRuntimeOptions(config, {
      token: null,
      baseUrl: baseUrl ?? null,
      profile: null,
    });
    runtimeBaseUrl = runtime.baseUrl;
    companyCreationMode = await resolveCompanyCreationMode(runtime.baseUrl, d.callInternalQuery);

    const bootstrapToken =
      method === "password"
        ? await runEmailSignup(runtime.baseUrl, d, options)
        : await runGoogleSignup(runtime.baseUrl, d);

    d.printSuccess("Account created.");

    const nextStep =
      options.nextStep ??
      await d.askChoice<SignupNextStep>(
        "What would you like to do next? You can also do this later with `operately auth create-company` or `operately auth join`.",
        [
          { label: "Create a company now", value: "create-company" },
          { label: "Join a company with an invite token", value: "join" },
          { label: "Do this later", value: "later" },
        ],
      );

    if (nextStep === "later") {
      d.printInfo("No CLI profile was saved because this account is not connected to a company yet.");
      d.printInfo("Use `operately auth create-company` later to create a company.");
      d.printInfo("Use `operately auth join` later to join an existing company.");
      return 0;
    }

    if (nextStep === "create-company") {
      return await createCompanyAndSaveProfile({
        config,
        registry,
        profileFlag,
        explicitBaseUrl: baseUrl,
        runtimeBaseUrl: runtime.baseUrl,
        timeoutMs: runtime.timeoutMs,
        bootstrapToken,
        mode: companyCreationMode,
        companyName: options.companyName,
        deps: {
          askQuestion: d.askQuestion,
          callInternalMutation: d.callInternalMutation,
          callEndpoint: d.callEndpoint,
          printError: d.printError,
          printSuccess: d.printSuccess,
        },
      });
    }

    return await joinCompanyAndSaveProfile(
      config,
      registry,
      profileFlag,
      baseUrl,
      runtime.baseUrl,
      runtime.timeoutMs,
      bootstrapToken,
      options.inviteToken,
      d,
    );
  } catch (error) {
    if (error instanceof PromptCancelledError) {
      d.printError("Signup cancelled.");
      return 1;
    }

    if (error instanceof SignupFlagError) {
      d.printError(error.message);
      return 2;
    }

    if (error instanceof ApiError) {
      if (error.status >= 500 || error.status === 0) {
        d.printError(`Server error at ${runtimeBaseUrl}. Please try again later.`);
        return 5;
      }

      const payload = error.payload;
      const msg =
        typeof payload === "object" && payload !== null && "message" in payload
          ? String((payload as { message: string }).message)
          : typeof payload === "string"
            ? payload
            : JSON.stringify(payload);

      d.printError(`Signup failed: ${msg}`);
      return 1;
    }

    if (error instanceof Error) {
      d.printError(error.message);
      return 1;
    }

    d.printError("Unexpected error during signup.");
    return 5;
  }
}

async function runEmailSignup(
  baseUrl: string,
  d: SignupFlowDeps,
  options: Pick<SignupFlagOptions, "fullName" | "email" | "password">,
): Promise<string> {
  const fullName = options.fullName ?? await d.askQuestion("Full name:");
  const email = options.email ?? await d.askQuestion("Email:");
  const password = options.password ?? await askForMatchingPassword(d);

  const checkResult = (await d.callInternalMutation(
    baseUrl,
    cliAuth.checkAccount,
    { email },
  )) as { exists: boolean };

  if (checkResult.exists) {
    throw new Error("An account already exists for this email. Use `operately auth login` or `operately auth join` instead.");
  }

  await d.callInternalMutation(baseUrl, "/create_email_activation_code", { email });

  const code = await d.askQuestion("A verification code was sent to your email. Enter the code:");

  const signupResult = (await d.callInternalMutation(
    baseUrl,
    cliAuth.signup,
    { email, code, full_name: fullName, password },
  )) as {
    bootstrap_token?: string;
  };

  if (!signupResult.bootstrap_token) {
    throw new Error("Signup failed: no bootstrap token returned.");
  }

  return signupResult.bootstrap_token;
}

async function askForMatchingPassword(d: SignupFlowDeps): Promise<string> {
  while (true) {
    const password = await d.askPassword("Password:");
    const passwordConfirmation = await d.askPassword("Confirm password:");

    if (password === passwordConfirmation) {
      return password;
    }

    d.printError("\nPasswords don't match\n");
  }
}

async function runGoogleSignup(baseUrl: string, d: SignupFlowDeps): Promise<string> {
  const result = await runGoogleFlow(
    baseUrl,
    {
      callInternalMutation: d.callInternalMutation,
      callInternalQuery: d.callInternalQuery,
      openUrl: d.openUrl,
    },
    { startPath: cliAuth.startGoogleSignup },
  );

  return result.bootstrapToken;
}

async function joinCompanyAndSaveProfile(
  config: CliConfig,
  registry: EndpointRegistry,
  profileFlag: string | null,
  explicitBaseUrl: string | null,
  runtimeBaseUrl: string,
  timeoutMs: number,
  bootstrapToken: string,
  inviteToken: string | null,
  d: SignupFlowDeps,
): Promise<number> {
  const resolvedInviteToken = (inviteToken ?? (await d.askQuestion("Invite token:"))).trim();
  const result = (await d.callInternalMutation(
    runtimeBaseUrl,
    cliAuth.joinWithInvite,
    { token: resolvedInviteToken },
    bootstrapToken,
  )) as { company?: Company };

  const profile = await resolveProfileName(config, profileFlag, d.askQuestion);

  return await createTokenAndSaveProfile({
    baseUrl: explicitBaseUrl,
    profile,
    config,
    runtimeBaseUrl,
    bootstrapToken,
    company: requireCompany(result.company, "Join failed: no company returned."),
    readOnly: false,
    timeoutMs,
    registry,
    callInternalMutation: d.callInternalMutation,
    callEndpoint: d.callEndpoint,
    printError: d.printError,
    printSuccess: d.printSuccess,
    saveProfile,
    writeConfig,
  });
}

function parseSignupFlagOptions(flags: Map<string, unknown[]>): SignupFlagOptions {
  return {
    baseUrl: readStringFlag(flags, "base-url"),
    profile: readStringFlag(flags, "profile"),
    method: normalizeSignupMethod(readStringFlag(flags, "method")),
    fullName: readStringFlag(flags, "full-name"),
    email: readStringFlag(flags, "email"),
    password: readStringFlag(flags, "password"),
    nextStep: normalizeSignupNextStep(readStringFlag(flags, "next-step")),
    companyName: readStringFlag(flags, "company-name"),
    inviteToken: readStringFlag(flags, "invite-token"),
  };
}

function validateSignupFlagOptions(
  flags: Map<string, unknown[]>,
  options: Pick<SignupFlagOptions, "method" | "nextStep">,
): void {
  if (options.method === "google" && (flags.has("full-name") || flags.has("email") || flags.has("password"))) {
    throw new SignupFlagError("`--method google` cannot be combined with `--full-name`, `--email`, or `--password`.");
  }

  if (options.nextStep === "later" && (flags.has("company-name") || flags.has("invite-token"))) {
    throw new SignupFlagError("`--next-step later` cannot be combined with `--company-name` or `--invite-token`.");
  }

  if (options.nextStep === "create-company" && flags.has("invite-token")) {
    throw new SignupFlagError("`--next-step create-company` cannot be combined with `--invite-token`.");
  }

  if (options.nextStep === "join" && flags.has("company-name")) {
    throw new SignupFlagError("`--next-step join` cannot be combined with `--company-name`.");
  }
}

function normalizeSignupMethod(value: string | null): SignupMethod | null {
  if (value === null) return null;

  const normalized = value.trim().toLowerCase();

  if (normalized === "email-password" || normalized === "password") {
    return "password";
  }

  if (normalized === "google") {
    return "google";
  }

  throw new SignupFlagError("Invalid value for `--method`. Use `email-password` or `google`.");
}

function normalizeSignupNextStep(value: string | null): SignupNextStep | null {
  if (value === null) return null;

  const normalized = value.trim().toLowerCase();

  if (normalized === "create-company") {
    return "create-company";
  }

  if (normalized === "join" || normalized === "join-invite") {
    return "join";
  }

  if (normalized === "later") {
    return "later";
  }

  throw new SignupFlagError("Invalid value for `--next-step`. Use `create-company`, `join`, or `later`.");
}

function readStringFlag(flags: Map<string, unknown[]>, name: string): string | null {
  const value = flags.get(name)?.at(-1);

  if (value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  throw new SignupFlagError(`Flag \`--${name}\` requires a value.`);
}
