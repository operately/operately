import { afterEach, beforeEach, describe, it } from "node:test";
import * as assert from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runSignupFlow } from "../../auth/flows/signup";
import { PromptCancelledError } from "../../core/prompts";
import { cliAuth } from "../../auth/shared/api";
import type { ChildProcess } from "child_process";

interface MockCall {
  method: "mutation" | "query" | "endpoint";
  path?: string;
  inputs: Record<string, unknown>;
  token?: string;
  timeoutMs?: number;
}

type AskChoiceFn = <T>(prompt: string, choices: { label: string; value: T }[]) => Promise<T>;
type AskQuestionFn = (prompt: string) => Promise<string>;
type AskPasswordFn = (prompt: string) => Promise<string>;
type SignupChoice = "password" | "google" | "create-company" | "join" | "later" | boolean;

const calls: MockCall[] = [];
let responses: Array<unknown> = [];
let promptQueue: Array<unknown> = [];
let askedPrompts: string[] = [];

function nextPrompt<T>(prompt: string, ..._args: unknown[]): Promise<T> {
  askedPrompts.push(prompt);

  if (promptQueue.length === 0) {
    throw new Error("Prompt requested, but promptQueue is empty");
  }

  return Promise.resolve(promptQueue.shift() as T);
}

function nextResponse(): Promise<unknown> {
  if (responses.length === 0) {
    throw new Error("Mock response requested, but responses is empty");
  }

  return Promise.resolve(responses.shift());
}

function mockMutation(
  _baseUrl: string,
  path: string,
  inputs: Record<string, unknown>,
  token?: string,
): Promise<unknown> {
  calls.push({ method: "mutation", path, inputs, token });
  return nextResponse();
}

function mockQuery(
  _baseUrl: string,
  path: string,
  inputs: Record<string, unknown>,
  token?: string,
): Promise<unknown> {
  calls.push({ method: "query", path, inputs, token });
  return nextResponse();
}

function mockEndpoint(args: {
  endpoint: unknown;
  baseUrl: string;
  token: string;
  inputs: Record<string, unknown>;
  timeoutMs: number;
  verbose?: boolean;
}): Promise<unknown> {
  calls.push({ method: "endpoint", inputs: args.inputs, token: args.token, timeoutMs: args.timeoutMs });
  return nextResponse();
}

function mockOpen(_url: string): Promise<ChildProcess | boolean | undefined> {
  return Promise.resolve(true);
}

function flagsFrom(entries: Record<string, unknown>): Map<string, unknown[]> {
  return new Map(Object.entries(entries).map(([key, value]) => [key, [value]]));
}

function createMockAskChoice(sequence: SignupChoice[]) {
  let index = 0;

  return async function askChoice<T>(
    prompt: string,
    _choices: { label: string; value: T }[],
  ): Promise<T> {
    askedPrompts.push(prompt);

    if (index >= sequence.length) {
      throw new Error(`Choice requested unexpectedly for prompt: ${prompt}`);
    }

    const value = sequence[index++];
    return value as T;
  };
}

const registryStub = {
  find: (parts: string[]) => {
    if (parts[0] === "people" && parts[1] === "get_me") {
      return {
        full_name: "people/get_me",
        namespace: "people",
        name: "get_me",
        type: "query",
        method: "GET",
        path: "/api/external/v1/people/get_me",
        handler: "OperatelyWeb.Api.People.GetMe",
        inputs: [],
        outputs: [],
        docstring: "Retrieves the current user's profile information.",
      };
    }

    return null;
  },
  byKey: new Map(),
  endpoints: [],
  commandFor: () => "",
} as unknown as import("../../commands/registry").EndpointRegistry;

const emptyConfig = {
  activeProfile: "default",
  profiles: {},
};

describe("runSignupFlow", () => {
  let tmpDir: string;
  let origHome: string | undefined;
  const errorsPrinted: string[] = [];
  const infoPrinted: string[] = [];
  const successPrinted: string[] = [];

  beforeEach(() => {
    calls.length = 0;
    responses = [];
    promptQueue = [];
    askedPrompts = [];
    errorsPrinted.length = 0;
    infoPrinted.length = 0;
    successPrinted.length = 0;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "op-cli-signup-test-"));
    origHome = process.env.HOME;
    process.env.HOME = tmpDir;
  });

  afterEach(() => {
    assert.strictEqual(promptQueue.length, 0, `promptQueue not empty: ${JSON.stringify(promptQueue)}`);
    assert.strictEqual(responses.length, 0, `responses not empty: ${JSON.stringify(responses)}`);

    if (origHome !== undefined) {
      process.env.HOME = origHome;
    }
  });

  function makeDeps(choiceSequence: SignupChoice[]) {
    return {
      askChoice: createMockAskChoice(choiceSequence) as AskChoiceFn,
      askQuestion: nextPrompt as AskQuestionFn,
      askPassword: nextPrompt as AskPasswordFn,
      callInternalMutation: mockMutation,
      callInternalQuery: mockQuery,
      callEndpoint: mockEndpoint,
      openUrl: mockOpen,
      printError: (msg: string) => errorsPrinted.push(msg),
      printInfo: (msg: string) => infoPrinted.push(msg),
      printSuccess: (msg: string) => successPrinted.push(msg),
      resolveRuntimeOptions: (_c: unknown, opts: { baseUrl?: string | null; token?: string | null; profile?: string | null }) => ({
        baseUrl: opts.baseUrl || "https://app.operately.com",
        token: opts.token || null,
        profile: opts.profile || "default",
        timeoutMs: 30000,
      }),
    };
  }

  it("signs up with email, creates a company, and saves the profile", async () => {
    promptQueue.push("", "New User", "newuser@example.com", "secret123456", "secret123456", "ABC123", "Acme Corp", "");

    responses.push({ configured: false });
    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });
    responses.push({ company: { id: "c1", name: "Acme Corp" } });
    responses.push({ token: "op_live_final_token", company: { id: "c1", name: "Acme Corp" } });
    responses.push({ me: { full_name: "New User", email: "newuser@example.com" } });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["password", "create-company"]));

    assert.strictEqual(result, 0);
    assert.ok(successPrinted.includes("Account created."));
    assert.ok(successPrinted.some((msg) => msg.includes("Logged in to https://app.operately.com as New User")));

    assert.strictEqual(calls[0].path, cliAuth.companyCreationStatus);
    assert.strictEqual(calls[1].path, cliAuth.checkAccount);
    assert.strictEqual(calls[2].path, "/create_email_activation_code");
    assert.strictEqual(calls[3].path, cliAuth.signup);
    assert.strictEqual(calls[4].path, cliAuth.setupCompany);
    assert.strictEqual(calls[5].path, cliAuth.createToken);
    assert.strictEqual(calls[5].token, "bootstrap_xxx");
    assert.strictEqual(calls[6].method, "endpoint");
    assert.strictEqual(calls[6].token, "op_live_final_token");

    const saved = readSavedConfig(tmpDir);
    assert.strictEqual(saved.activeProfile, "default");
    assert.strictEqual(saved.profiles.default.token, "op_live_final_token");
    assert.strictEqual(saved.profiles.default.name, "New User");
    assert.strictEqual(saved.profiles.default.companyName, "Acme Corp");
  });

  it("uses create_company when the instance is already configured", async () => {
    promptQueue.push("", "New User", "newuser@example.com", "secret123456", "secret123456", "ABC123", "Acme Corp", "team");

    responses.push({ configured: true });
    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });
    responses.push({ company: { id: "c2", name: "Acme Corp" } });
    responses.push({ token: "op_live_team_token", company: { id: "c2", name: "Acme Corp" } });
    responses.push({ me: { full_name: "New User", email: "newuser@example.com" } });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["password", "create-company"]));

    assert.strictEqual(result, 0);
    assert.strictEqual(calls[0].path, cliAuth.companyCreationStatus);
    assert.strictEqual(calls[4].path, cliAuth.createCompany);
  });

  it("signs up with email, joins via invite token, and saves the profile", async () => {
    promptQueue.push("", "New User", "newuser@example.com", "secret123456", "secret123456", "ABC123", "invite-token-123", "joined");

    responses.push({ configured: true });
    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });
    responses.push({ company: { id: "joined-company", name: "Joined Company" } });
    responses.push({ token: "op_joined_token", company: { id: "joined-company", name: "Joined Company" } });
    responses.push({ me: { full_name: "New User", email: "newuser@example.com" } });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["password", "join"]));

    assert.strictEqual(result, 0);
    assert.strictEqual(calls[4].path, cliAuth.joinWithInvite);
    assert.deepStrictEqual(calls[4].inputs, { token: "invite-token-123" });
    assert.strictEqual(calls[5].path, cliAuth.createToken);

    const saved = readSavedConfig(tmpDir);
    assert.strictEqual(saved.activeProfile, "joined");
    assert.strictEqual(saved.profiles.joined.companyName, "Joined Company");
  });

  it("signs up with email and exits cleanly when the user chooses to do this later", async () => {
    promptQueue.push("", "New User", "newuser@example.com", "secret123456", "secret123456", "ABC123");

    responses.push({ configured: true });
    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["password", "later"]));

    assert.strictEqual(result, 0);
    assert.ok(successPrinted.includes("Account created."));
    assert.ok(infoPrinted.some((msg) => msg.includes("No CLI profile was saved")));
    assert.ok(infoPrinted.some((msg) => msg.includes("operately auth create-company")));
    assert.ok(infoPrinted.some((msg) => msg.includes("operately auth join")));
    assert.ok(!fs.existsSync(path.join(tmpDir, ".operately", "config.json")));
    assert.ok(!askedPrompts.includes("Profile name (default: default):"));
  });

  it("uses provided flags and only prompts for missing email signup values", async () => {
    promptQueue.push("New User", "secret123456", "secret123456", "ABC123");

    responses.push({ configured: true });
    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });

    const result = await runSignupFlow(
      flagsFrom({
        method: "email-password",
        "base-url": "https://app.operately.com",
        email: "newuser@example.com",
      }),
      emptyConfig,
      registryStub,
      makeDeps(["later"]),
    );

    assert.strictEqual(result, 0);
    assert.ok(!askedPrompts.includes("How would you like to sign up?"));
    assert.ok(!askedPrompts.includes(`Base URL for the Operately instance (default: https://app.operately.com):`));
    assert.ok(!askedPrompts.includes("Email:"));
    assert.ok(askedPrompts.includes("Full name:"));
    assert.ok(askedPrompts.includes("Password:"));
    assert.ok(askedPrompts.includes("Confirm password:"));
    assert.ok(askedPrompts.includes("A verification code was sent to your email. Enter the code:"));
    assert.ok(askedPrompts.includes("What would you like to do next? You can also do this later with `operately auth create-company` or `operately auth join`."));
  });

  it("uses email signup flags so only the verification code prompt remains", async () => {
    promptQueue.push("ABC123");

    responses.push({ configured: true });
    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });

    const result = await runSignupFlow(
      flagsFrom({
        method: "password",
        "base-url": "https://app.operately.com",
        "full-name": "New User",
        email: "newuser@example.com",
        password: "secret123456",
        "next-step": "later",
      }),
      emptyConfig,
      registryStub,
      makeDeps([]),
    );

    assert.strictEqual(result, 0);
    assert.deepStrictEqual(askedPrompts, ["A verification code was sent to your email. Enter the code:"]);
    assert.deepStrictEqual(calls.map((call) => call.path), [
      cliAuth.companyCreationStatus,
      cliAuth.checkAccount,
      "/create_email_activation_code",
      cliAuth.signup,
    ]);
    assert.deepStrictEqual(calls[3].inputs, {
      email: "newuser@example.com",
      code: "ABC123",
      full_name: "New User",
      password: "secret123456",
    });
  });

  it("uses Google signup flags and only prompts for an intentionally omitted company name", async () => {
    promptQueue.push("Google Company");

    responses.push({ configured: true });
    responses.push({
      status: "pending",
      bootstrap_token: "bootstrap_google",
      login_url: "https://example.com/cli-login/123",
      poll_interval_ms: 10,
    });
    responses.push({ status: "authenticated", companies: [] });
    responses.push({ company: { id: "google-company", name: "Google Company" } });
    responses.push({ token: "op_google_token", company: { id: "google-company", name: "Google Company" } });
    responses.push({ me: { full_name: "Google User", email: "google@example.com" } });

    const result = await runSignupFlow(
      flagsFrom({
        method: "google",
        "base-url": "https://app.operately.com",
        "next-step": "create-company",
        profile: "google",
      }),
      emptyConfig,
      registryStub,
      makeDeps([]),
    );

    assert.strictEqual(result, 0);
    assert.deepStrictEqual(askedPrompts, ["Company name:"]);
    assert.strictEqual(calls[0].path, cliAuth.companyCreationStatus);
    assert.strictEqual(calls[1].path, cliAuth.startGoogleSignup);
    assert.strictEqual(calls[2].path, cliAuth.status);
    assert.strictEqual(calls[3].path, cliAuth.createCompany);
  });

  it("prompts only for company name after email signup when next step is create-company", async () => {
    promptQueue.push("ABC123", "Acme Corp");

    responses.push({ configured: true });
    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });
    responses.push({ company: { id: "c1", name: "Acme Corp" } });
    responses.push({ token: "op_live_final_token", company: { id: "c1", name: "Acme Corp" } });
    responses.push({ me: { full_name: "New User", email: "newuser@example.com" } });

    const result = await runSignupFlow(
      flagsFrom({
        method: "email-password",
        "base-url": "https://app.operately.com",
        "full-name": "New User",
        email: "newuser@example.com",
        password: "secret123456",
        "next-step": "create-company",
        profile: "team",
      }),
      emptyConfig,
      registryStub,
      makeDeps([]),
    );

    assert.strictEqual(result, 0);
    assert.deepStrictEqual(askedPrompts, [
      "A verification code was sent to your email. Enter the code:",
      "Company name:",
    ]);
  });

  it("prompts only for invite token after email signup when next step is join", async () => {
    promptQueue.push("ABC123", "invite-token-123");

    responses.push({ configured: true });
    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });
    responses.push({ company: { id: "joined-company", name: "Joined Company" } });
    responses.push({ token: "op_joined_token", company: { id: "joined-company", name: "Joined Company" } });
    responses.push({ me: { full_name: "New User", email: "newuser@example.com" } });

    const result = await runSignupFlow(
      flagsFrom({
        method: "email-password",
        "base-url": "https://app.operately.com",
        "full-name": "New User",
        email: "newuser@example.com",
        password: "secret123456",
        "next-step": "join-invite",
        profile: "joined",
      }),
      emptyConfig,
      registryStub,
      makeDeps([]),
    );

    assert.strictEqual(result, 0);
    assert.deepStrictEqual(askedPrompts, [
      "A verification code was sent to your email. Enter the code:",
      "Invite token:",
    ]);
    assert.strictEqual(calls[4].path, cliAuth.joinWithInvite);
  });

  it("rejects signup when the email already exists", async () => {
    promptQueue.push("", "Existing User", "existing@example.com", "secret123456", "secret123456");

    responses.push({ configured: true });
    responses.push({ exists: true });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["password"]));

    assert.strictEqual(result, 1);
    assert.ok(errorsPrinted.some((msg) => msg.includes("already exists for this email")));
    assert.strictEqual(calls.length, 2);
    assert.strictEqual(calls[0].path, cliAuth.companyCreationStatus);
    assert.strictEqual(calls[1].path, cliAuth.checkAccount);
  });

  it("re-prompts for the password when the confirmation does not match", async () => {
    promptQueue.push(
      "",
      "New User",
      "newuser@example.com",
      "secret123456",
      "different-password",
      "secret123456",
      "secret123456",
      "ABC123",
    );

    responses.push({ configured: true });
    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["password", "later"]));

    assert.strictEqual(result, 0);
    assert.ok(errorsPrinted.includes("\nPasswords don't match\n"));
    assert.strictEqual(calls[0].path, cliAuth.companyCreationStatus);
    assert.strictEqual(calls[1].path, cliAuth.checkAccount);
    assert.strictEqual(calls[2].path, "/create_email_activation_code");
    assert.strictEqual(calls[3].path, cliAuth.signup);
    assert.deepStrictEqual(calls[3].inputs, {
      email: "newuser@example.com",
      code: "ABC123",
      full_name: "New User",
      password: "secret123456",
    });
  });

  it("signs up with Google, creates a company, and saves the profile", async () => {
    promptQueue.push("", "Google Company", "google");

    responses.push({ configured: false });
    responses.push({
      status: "pending",
      bootstrap_token: "bootstrap_google",
      login_url: "https://example.com/cli-login/123",
      poll_interval_ms: 10,
    });
    responses.push({ status: "authenticated", companies: [] });
    responses.push({ company: { id: "google-company", name: "Google Company" } });
    responses.push({ token: "op_google_token", company: { id: "google-company", name: "Google Company" } });
    responses.push({ me: { full_name: "Google User", email: "google@example.com" } });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["google", "create-company"]));

    assert.strictEqual(result, 0);
    assert.strictEqual(calls[0].path, cliAuth.companyCreationStatus);
    assert.strictEqual(calls[1].path, cliAuth.startGoogleSignup);
    assert.strictEqual(calls[2].path, cliAuth.status);
    assert.strictEqual(calls[3].path, cliAuth.setupCompany);

    const saved = readSavedConfig(tmpDir);
    assert.strictEqual(saved.activeProfile, "google");
    assert.strictEqual(saved.profiles.google.name, "Google User");
  });

  it("signs up with Google, exits later, and does not save a profile", async () => {
    promptQueue.push("");

    responses.push({ configured: true });
    responses.push({
      status: "pending",
      bootstrap_token: "bootstrap_google",
      login_url: "https://example.com/cli-login/123",
      poll_interval_ms: 10,
    });
    responses.push({ status: "authenticated", companies: [] });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["google", "later"]));

    assert.strictEqual(result, 0);
    assert.ok(!fs.existsSync(path.join(tmpDir, ".operately", "config.json")));
    assert.ok(!askedPrompts.includes("Profile name (default: default):"));
  });

  it("rejects Google signup when Google resolves to an existing account", async () => {
    promptQueue.push("");

    responses.push({ configured: true });
    responses.push({
      status: "pending",
      bootstrap_token: "bootstrap_google",
      login_url: "https://example.com/cli-login/123",
      poll_interval_ms: 10,
    });
    responses.push({
      status: "failed",
      message: "An account already exists for this Google account. Use `operately auth login` or `operately auth join` instead.",
    });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["google"]));

    assert.strictEqual(result, 1);
    assert.ok(errorsPrinted.some((msg) => msg.includes("An account already exists for this Google account")));
    assert.ok(!fs.existsSync(path.join(tmpDir, ".operately", "config.json")));
  });

  it("does not save a profile on the later path even when --profile is passed", async () => {
    promptQueue.push("ABC123");

    responses.push({ configured: true });
    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });

    const result = await runSignupFlow(
      flagsFrom({
        method: "email-password",
        "base-url": "https://app.operately.com",
        "full-name": "New User",
        email: "newuser@example.com",
        password: "secret123456",
        "next-step": "later",
        profile: "team",
      }),
      emptyConfig,
      registryStub,
      makeDeps([]),
    );

    assert.strictEqual(result, 0);
    assert.ok(!fs.existsSync(path.join(tmpDir, ".operately", "config.json")));
  });

  for (const scenario of [
    {
      name: "rejects an unsupported --method value",
      flags: flagsFrom({ method: "github" }),
      expected: "Invalid value for `--method`. Use `email-password` or `google`.",
    },
    {
      name: "rejects an unsupported --next-step value",
      flags: flagsFrom({ "next-step": "create" }),
      expected: "Invalid value for `--next-step`. Use `create-company`, `join`, or `later`.",
    },
    {
      name: "rejects Google signup when email flags are also passed",
      flags: flagsFrom({ method: "google", email: "newuser@example.com" }),
      expected: "`--method google` cannot be combined with `--full-name`, `--email`, or `--password`.",
    },
    {
      name: "rejects later next step when company flags are also passed",
      flags: flagsFrom({ "next-step": "later", "invite-token": "invite-123" }),
      expected: "`--next-step later` cannot be combined with `--company-name` or `--invite-token`.",
    },
    {
      name: "rejects create-company next step with invite token",
      flags: flagsFrom({ "next-step": "create-company", "invite-token": "invite-123" }),
      expected: "`--next-step create-company` cannot be combined with `--invite-token`.",
    },
    {
      name: "rejects join next step with company name",
      flags: flagsFrom({ "next-step": "join", "company-name": "Acme Corp" }),
      expected: "`--next-step join` cannot be combined with `--company-name`.",
    },
  ]) {
    it(scenario.name, async () => {
      const result = await runSignupFlow(scenario.flags, emptyConfig, registryStub, makeDeps([]));

      assert.strictEqual(result, 2);
      assert.deepStrictEqual(errorsPrinted, [scenario.expected]);
      assert.deepStrictEqual(askedPrompts, []);
      assert.deepStrictEqual(calls, []);
    });
  }

  it("cancels cleanly when the user aborts a prompt", async () => {
    const deps = makeDeps(["password"]);
    deps.askQuestion = () => Promise.reject(new PromptCancelledError("cancelled"));

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, deps);

    assert.strictEqual(result, 1);
    assert.ok(errorsPrinted.includes("Signup cancelled."));
  });
});

function readSavedConfig(tmpDir: string): {
  activeProfile: string;
  profiles: Record<string, { token?: string; name?: string; companyName?: string }>;
} {
  const configPath = path.join(tmpDir, ".operately", "config.json");
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}
