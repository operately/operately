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
import { createTokenAndSaveProfile } from "../shared/token-creation";
import { runGoogleFlow } from "./login-google";
import type { EndpointRegistry } from "../../commands/registry";
import type { Company } from "../types";
import type { ChildProcess } from "child_process";

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

  let baseUrl = readStringFlag(flags, "base-url");
  const profileFlag = readStringFlag(flags, "profile");
  let runtimeBaseUrl = baseUrl ?? DEFAULT_BASE_URL;

  try {
    const method = await d.askChoice<"password" | "google">("How would you like to sign up?", [
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

    const bootstrapToken =
      method === "password"
        ? await runEmailSignup(runtime.baseUrl, d)
        : await runGoogleSignup(runtime.baseUrl, d);

    d.printSuccess("Account created.");

    const nextStep = await d.askChoice<"create-company" | "join-invite" | "later">(
      "What would you like to do next? You can also do this later with `operately auth join`.",
      [
        { label: "Create a company now", value: "create-company" },
        { label: "Join a company with an invite token", value: "join-invite" },
        { label: "Do this later", value: "later" },
      ],
    );

    if (nextStep === "later") {
      d.printInfo("No CLI profile was saved because this account is not connected to a company yet.");
      d.printInfo("Use `operately auth join` later to join an existing company.");
      d.printInfo("A command to create a company from an existing account will be added separately.");
      return 0;
    }

    if (nextStep === "create-company") {
      return await createCompanyAndSaveProfile(
        config,
        registry,
        profileFlag,
        baseUrl,
        runtime.baseUrl,
        runtime.timeoutMs,
        bootstrapToken,
        d,
      );
    }

    return await joinCompanyAndSaveProfile(
      config,
      registry,
      profileFlag,
      baseUrl,
      runtime.baseUrl,
      runtime.timeoutMs,
      bootstrapToken,
      d,
    );
  } catch (error) {
    if (error instanceof PromptCancelledError) {
      d.printError("Signup cancelled.");
      return 1;
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

async function runEmailSignup(baseUrl: string, d: SignupFlowDeps): Promise<string> {
  const fullName = await d.askQuestion("Full name:");
  const email = await d.askQuestion("Email:");
  const password = await askForMatchingPassword(d);

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

async function createCompanyAndSaveProfile(
  config: CliConfig,
  registry: EndpointRegistry,
  profileFlag: string | null,
  explicitBaseUrl: string | null,
  runtimeBaseUrl: string,
  timeoutMs: number,
  bootstrapToken: string,
  d: SignupFlowDeps,
): Promise<number> {
  const companyName = await d.askQuestion("Company name:");

  let company: Company;

  try {
    const result = (await d.callInternalMutation(
      runtimeBaseUrl,
      cliAuth.createCompany,
      { company_name: companyName },
      bootstrapToken,
    )) as { company?: Company };

    company = assertCompany(result.company);
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 403) {
      throw error;
    }

    const result = (await d.callInternalMutation(
      runtimeBaseUrl,
      cliAuth.createCompanyOnNonEmpty,
      { company_name: companyName },
      bootstrapToken,
    )) as { company?: Company };

    company = assertCompany(result.company);
  }

  const profile = await resolveProfileName(profileFlag, d.askQuestion);

  return await createTokenAndSaveProfile({
    baseUrl: explicitBaseUrl,
    profile,
    config,
    runtimeBaseUrl,
    bootstrapToken,
    company,
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

async function joinCompanyAndSaveProfile(
  config: CliConfig,
  registry: EndpointRegistry,
  profileFlag: string | null,
  explicitBaseUrl: string | null,
  runtimeBaseUrl: string,
  timeoutMs: number,
  bootstrapToken: string,
  d: SignupFlowDeps,
): Promise<number> {
  const inviteToken = (await d.askQuestion("Invite token:")).trim();
  const result = (await d.callInternalMutation(
    runtimeBaseUrl,
    cliAuth.joinWithInvite,
    { token: inviteToken },
    bootstrapToken,
  )) as { company?: Company };

  const profile = await resolveProfileName(profileFlag, d.askQuestion);

  return await createTokenAndSaveProfile({
    baseUrl: explicitBaseUrl,
    profile,
    config,
    runtimeBaseUrl,
    bootstrapToken,
    company: assertCompany(result.company),
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

async function resolveProfileName(
  profileFlag: string | null,
  askQuestionFn: typeof askQuestion,
): Promise<string> {
  if (profileFlag) {
    return profileFlag;
  }

  const answer = await askQuestionFn("Profile name (default: default):");
  return answer.trim() || "default";
}

function assertCompany(company: Company | undefined): Company {
  if (!company?.id) {
    throw new Error("Signup failed: no company returned.");
  }

  return company;
}

function readStringFlag(flags: Map<string, unknown[]>, name: string): string | null {
  const value = flags.get(name)?.at(-1);
  if (typeof value === "string") return value;
  return null;
}
