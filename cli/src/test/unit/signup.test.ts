import { afterEach, beforeEach, describe, it } from "node:test";
import * as assert from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runSignupFlow } from "../../auth/flows/signup";
import { ApiError } from "../../core/http";
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

function createMockAskChoice(sequence: Array<"password" | "google" | "create-company" | "join-invite" | "later" | boolean>) {
  let index = 0;

  return async function askChoice<T>(
    prompt: string,
    _choices: { label: string; value: T }[],
  ): Promise<T> {
    askedPrompts.push(prompt);
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

  function makeDeps(choiceSequence: Array<"password" | "google" | "create-company" | "join-invite" | "later" | boolean>) {
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

    assert.strictEqual(calls[0].path, cliAuth.checkAccount);
    assert.strictEqual(calls[1].path, "/create_email_activation_code");
    assert.strictEqual(calls[2].path, cliAuth.signup);
    assert.strictEqual(calls[3].path, cliAuth.createCompany);
    assert.strictEqual(calls[4].path, cliAuth.createToken);
    assert.strictEqual(calls[4].token, "bootstrap_xxx");
    assert.strictEqual(calls[5].method, "endpoint");
    assert.strictEqual(calls[5].token, "op_live_final_token");

    const saved = readSavedConfig(tmpDir);
    assert.strictEqual(saved.activeProfile, "default");
    assert.strictEqual(saved.profiles.default.token, "op_live_final_token");
    assert.strictEqual(saved.profiles.default.name, "New User");
    assert.strictEqual(saved.profiles.default.companyName, "Acme Corp");
  });

  it("falls back to create_company_on_non_empty when the instance already has companies", async () => {
    promptQueue.push("", "New User", "newuser@example.com", "secret123456", "secret123456", "ABC123", "Acme Corp", "team");

    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });
    responses.push({ company: { id: "c2", name: "Acme Corp" } });
    responses.push({ token: "op_live_team_token", company: { id: "c2", name: "Acme Corp" } });
    responses.push({ me: { full_name: "New User", email: "newuser@example.com" } });

    const deps = makeDeps(["password", "create-company"]);
    deps.callInternalMutation = (_baseUrl: string, path: string, inputs: Record<string, unknown>, token?: string) => {
      if (path === cliAuth.createCompany) {
        calls.push({ method: "mutation", path, inputs, token });
        return Promise.reject(new ApiError("Forbidden", 403, { message: "Companies already exist" }));
      }

      return mockMutation(_baseUrl, path, inputs, token);
    };

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, deps);

    assert.strictEqual(result, 0);
    assert.strictEqual(calls[3].path, cliAuth.createCompany);
    assert.strictEqual(calls[4].path, cliAuth.createCompanyOnNonEmpty);
  });

  it("signs up with email, joins via invite token, and saves the profile", async () => {
    promptQueue.push("", "New User", "newuser@example.com", "secret123456", "secret123456", "ABC123", "invite-token-123", "joined");

    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });
    responses.push({ company: { id: "joined-company", name: "Joined Company" } });
    responses.push({ token: "op_joined_token", company: { id: "joined-company", name: "Joined Company" } });
    responses.push({ me: { full_name: "New User", email: "newuser@example.com" } });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["password", "join-invite"]));

    assert.strictEqual(result, 0);
    assert.strictEqual(calls[3].path, cliAuth.joinWithInvite);
    assert.deepStrictEqual(calls[3].inputs, { token: "invite-token-123" });
    assert.strictEqual(calls[4].path, cliAuth.createToken);

    const saved = readSavedConfig(tmpDir);
    assert.strictEqual(saved.activeProfile, "joined");
    assert.strictEqual(saved.profiles.joined.companyName, "Joined Company");
  });

  it("signs up with email and exits cleanly when the user chooses to do this later", async () => {
    promptQueue.push("", "New User", "newuser@example.com", "secret123456", "secret123456", "ABC123");

    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["password", "later"]));

    assert.strictEqual(result, 0);
    assert.ok(successPrinted.includes("Account created."));
    assert.ok(infoPrinted.some((msg) => msg.includes("No CLI profile was saved")));
    assert.ok(infoPrinted.some((msg) => msg.includes("operately auth join")));
    assert.ok(!fs.existsSync(path.join(tmpDir, ".operately", "config.json")));
    assert.ok(!askedPrompts.includes("Profile name (default: default):"));
  });

  it("rejects signup when the email already exists", async () => {
    promptQueue.push("", "Existing User", "existing@example.com", "secret123456", "secret123456");

    responses.push({ exists: true });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["password"]));

    assert.strictEqual(result, 1);
    assert.ok(errorsPrinted.some((msg) => msg.includes("already exists for this email")));
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].path, cliAuth.checkAccount);
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

    responses.push({ exists: false });
    responses.push({});
    responses.push({ status: "authenticated", companies: [], bootstrap_token: "bootstrap_xxx" });

    const result = await runSignupFlow(new Map(), emptyConfig, registryStub, makeDeps(["password", "later"]));

    assert.strictEqual(result, 0);
    assert.ok(errorsPrinted.includes("\nPasswords don't match\n"));
    assert.strictEqual(calls[0].path, cliAuth.checkAccount);
    assert.strictEqual(calls[1].path, "/create_email_activation_code");
    assert.strictEqual(calls[2].path, cliAuth.signup);
    assert.deepStrictEqual(calls[2].inputs, {
      email: "newuser@example.com",
      code: "ABC123",
      full_name: "New User",
      password: "secret123456",
    });
  });

  it("signs up with Google, creates a company, and saves the profile", async () => {
    promptQueue.push("", "Google Company", "google");

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
    assert.strictEqual(calls[0].path, cliAuth.startGoogleSignup);
    assert.strictEqual(calls[1].path, cliAuth.status);

    const saved = readSavedConfig(tmpDir);
    assert.strictEqual(saved.activeProfile, "google");
    assert.strictEqual(saved.profiles.google.name, "Google User");
  });

  it("signs up with Google, exits later, and does not save a profile", async () => {
    promptQueue.push("");

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
