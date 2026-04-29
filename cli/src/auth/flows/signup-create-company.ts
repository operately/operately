import {
  resolveRuntimeOptions,
  saveProfile,
  writeConfig,
  DEFAULT_BASE_URL,
  type CliConfig,
} from "../config";
import { printError, printSuccess } from "../../core/output";
import { callInternalMutation } from "../../core/internal-api";
import { askQuestion, askPassword, askChoice, PromptCancelledError } from "../../core/prompts";
import { callEndpoint, ApiError } from "../../core/http";
import { cliAuth } from "../shared/api";
import { selectCompany } from "../shared/company-selection";
import { createTokenAndSaveProfile } from "../shared/token-creation";
import type { EndpointRegistry } from "../../commands/registry";
import type { Company } from "../types";

interface SignupCreateCompanyDeps {
  askQuestion: typeof askQuestion;
  askPassword: typeof askPassword;
  askChoice: typeof askChoice;
  callInternalMutation: typeof callInternalMutation;
  callEndpoint: typeof callEndpoint;
  printError: typeof printError;
  printSuccess: typeof printSuccess;
  saveProfile: typeof saveProfile;
  writeConfig: typeof writeConfig;
  resolveRuntimeOptions: typeof resolveRuntimeOptions;
}

const defaultDeps: SignupCreateCompanyDeps = {
  askQuestion,
  askPassword,
  askChoice,
  callInternalMutation,
  callEndpoint,
  printError,
  printSuccess,
  saveProfile,
  writeConfig,
  resolveRuntimeOptions,
};

export async function runSignupCreateCompanyFlow(
  flags: Map<string, unknown[]>,
  config: CliConfig,
  registry: EndpointRegistry,
  deps: Partial<SignupCreateCompanyDeps> = {},
): Promise<number> {
  const d = { ...defaultDeps, ...deps };

  let baseUrl = readStringFlag(flags, "base-url");
  let profile = readStringFlag(flags, "profile");
  let runtimeBaseUrl = baseUrl ?? DEFAULT_BASE_URL;

  try {
    const email = await d.askQuestion("Email:");

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

    const checkResult = (await d.callInternalMutation(
      runtime.baseUrl,
      cliAuth.checkAccount,
      { email },
    )) as { exists: boolean };

    if (checkResult.exists) {
      d.printError("An account already exists for this email. Use `operately auth login` instead.");
      return 1;
    }

    await d.callInternalMutation(runtime.baseUrl, "/create_email_activation_code", { email });

    const code = await d.askQuestion("A verification code was sent to your email. Enter the code:");

    const fullName = await d.askQuestion("Full name:");

    const password = await d.askPassword("Password:");

    const signupResult = (await d.callInternalMutation(
      runtime.baseUrl,
      cliAuth.signup,
      { email, code, full_name: fullName, password },
    )) as {
      status: string;
      companies: Company[];
      bootstrap_token?: string;
      message?: string;
    };

    if (!signupResult.bootstrap_token) {
      d.printError("Signup failed: no bootstrap token returned.");
      return 1;
    }

    let companies = signupResult.companies ?? [];
    const bootstrapToken = signupResult.bootstrap_token;

    if (signupResult.status === "no_companies") {
      const companyName = await d.askQuestion("Company name:");

      try {
        await d.callInternalMutation(
          runtime.baseUrl,
          cliAuth.createCompany,
          { company_name: companyName },
          bootstrapToken,
        );
      } catch (error) {
        if (error instanceof ApiError && error.status === 403) {
          d.printError("This instance already has one or more companies.");
          d.printError("As a new user, you cannot create a company here.");
          d.printError("Please use 'Join a company with an invite' instead.");
          return 1;
        }
        throw error;
      }

      const statusResult = (await d.callInternalMutation(
        runtime.baseUrl,
        cliAuth.status,
        {},
        bootstrapToken,
      )) as { status: string; companies: Company[] };

      if (statusResult.status !== "authenticated" || statusResult.companies.length === 0) {
        d.printError("Failed to create company. Please try again.");
        return 1;
      }

      companies = statusResult.companies;
    }

    if (companies.length === 0) {
      d.printError(signupResult.message || "No companies available. Please join or create a company first.");
      return 1;
    }

    const company = await selectCompany(companies, d.askChoice);

    const readOnly = await d.askChoice<boolean>("Select access mode:", [
      { label: "Read-only", value: true },
      { label: "Full access", value: false },
    ]);

    return await createTokenAndSaveProfile({
      baseUrl: baseUrl ?? null,
      profile,
      config,
      runtimeBaseUrl: runtime.baseUrl,
      bootstrapToken,
      company,
      readOnly,
      timeoutMs: runtime.timeoutMs,
      registry,
      callInternalMutation: d.callInternalMutation,
      callEndpoint: d.callEndpoint,
      printError: d.printError,
      printSuccess: d.printSuccess,
      saveProfile: d.saveProfile,
      writeConfig: d.writeConfig,
    });
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

function readStringFlag(flags: Map<string, unknown[]>, name: string): string | null {
  const value = flags.get(name)?.at(-1);
  if (typeof value === "string") return value;
  return null;
}
