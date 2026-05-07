import { afterEach, beforeEach, describe, it } from "node:test";
import * as assert from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runCreateCompanyFlow } from "../../auth/flows/create-company";
import { ApiError } from "../../core/http";
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

function createMockAskChoice(sequence: Array<"password" | "google">) {
  let index = 0;

  return async function askChoice<T>(
    prompt: string,
    _choices: { label: string; value: T }[],
  ): Promise<T> {
    askedPrompts.push(prompt);
    return sequence[index++] as T;
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

describe("runCreateCompanyFlow", () => {
  let tmpDir: string;
  let origHome: string | undefined;
  const errorsPrinted: string[] = [];
  const successPrinted: string[] = [];

  beforeEach(() => {
    calls.length = 0;
    responses = [];
    promptQueue = [];
    askedPrompts = [];
    errorsPrinted.length = 0;
    successPrinted.length = 0;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "op-cli-create-company-test-"));
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

  function makeDeps(choiceSequence: Array<"password" | "google">) {
    return {
      askChoice: createMockAskChoice(choiceSequence) as AskChoiceFn,
      askQuestion: nextPrompt as AskQuestionFn,
      askPassword: nextPrompt as AskPasswordFn,
      callInternalMutation: mockMutation,
      callInternalQuery: mockQuery,
      callEndpoint: mockEndpoint,
      openUrl: mockOpen,
      printError: (msg: string) => errorsPrinted.push(msg),
      printSuccess: (msg: string) => successPrinted.push(msg),
      resolveRuntimeOptions: (_c: unknown, opts: { baseUrl?: string | null; token?: string | null; profile?: string | null }) => ({
        baseUrl: opts.baseUrl || "https://app.operately.com",
        token: opts.token || null,
        profile: opts.profile || "default",
        timeoutMs: 30000,
      }),
    };
  }

  it("authenticates with password, creates a company, and saves the profile for a no-company account", async () => {
    promptQueue.push("", "user@example.com", "secret123456", "Acme Corp", "");

    responses.push({ configured: true });
    responses.push({
      status: "no_companies",
      companies: [],
      bootstrap_token: "bootstrap_password",
    });
    responses.push({ company: { id: "c1", name: "Acme Corp" } });
    responses.push({ token: "op_live_final_token", company: { id: "c1", name: "Acme Corp" } });
    responses.push({ me: { full_name: "Existing User", email: "user@example.com" } });

    const result = await runCreateCompanyFlow(new Map(), emptyConfig, registryStub, makeDeps(["password"]));

    assert.strictEqual(result, 0);
    assert.strictEqual(calls[0].path, cliAuth.companyCreationStatus);
    assert.strictEqual(calls[1].path, cliAuth.authPassword);
    assert.strictEqual(calls[2].path, cliAuth.createCompany);
    assert.strictEqual(calls[3].path, cliAuth.createToken);
    assert.strictEqual(calls[3].token, "bootstrap_password");
    assert.ok(successPrinted.some((msg) => msg.includes("Logged in to https://app.operately.com as Existing User")));

    const saved = readSavedConfig(tmpDir);
    assert.strictEqual(saved.activeProfile, "default");
    assert.strictEqual(saved.profiles.default.token, "op_live_final_token");
    assert.strictEqual(saved.profiles.default.companyName, "Acme Corp");
  });

  it("authenticates with Google, creates a company, and saves the profile for a no-company account", async () => {
    promptQueue.push("", "Acme Corp", "team");

    responses.push({ configured: true });
    responses.push({
      status: "pending",
      bootstrap_token: "bootstrap_google",
      login_url: "https://example.com/cli-login/123",
      poll_interval_ms: 10,
    });
    responses.push({ status: "no_companies", companies: [] });
    responses.push({ company: { id: "c2", name: "Acme Corp" } });
    responses.push({ token: "op_google_token", company: { id: "c2", name: "Acme Corp" } });
    responses.push({ me: { full_name: "Google User", email: "google@example.com" } });

    const result = await runCreateCompanyFlow(new Map(), emptyConfig, registryStub, makeDeps(["google"]));

    assert.strictEqual(result, 0);
    assert.strictEqual(calls[0].path, cliAuth.companyCreationStatus);
    assert.strictEqual(calls[1].path, cliAuth.startGoogle);
    assert.strictEqual(calls[2].path, cliAuth.status);
    assert.strictEqual(calls[3].path, cliAuth.createCompany);

    const saved = readSavedConfig(tmpDir);
    assert.strictEqual(saved.activeProfile, "team");
    assert.strictEqual(saved.profiles.team.name, "Google User");
    assert.strictEqual(saved.profiles.team.companyName, "Acme Corp");
  });

  it("uses setup_company when the instance is not configured", async () => {
    promptQueue.push("", "user@example.com", "secret123456", "Second Company", "work");

    responses.push({ configured: false });
    responses.push({
      status: "no_companies",
      companies: [],
      bootstrap_token: "bootstrap_password",
    });
    responses.push({ company: { id: "c3", name: "Second Company" } });
    responses.push({ token: "op_team_token", company: { id: "c3", name: "Second Company" } });
    responses.push({ me: { full_name: "Existing User", email: "user@example.com" } });

    const result = await runCreateCompanyFlow(new Map(), emptyConfig, registryStub, makeDeps(["password"]));

    assert.strictEqual(result, 0);
    assert.strictEqual(calls[0].path, cliAuth.companyCreationStatus);
    assert.strictEqual(calls[2].path, cliAuth.setupCompany);
  });

  it("asks for the profile name only after company creation succeeds", async () => {
    promptQueue.push("", "user@example.com", "secret123456", "Taken Company");

    responses.push({ configured: true });
    responses.push({
      status: "no_companies",
      companies: [],
      bootstrap_token: "bootstrap_password",
    });

    const deps = makeDeps(["password"]);
    deps.callInternalMutation = (_baseUrl: string, path: string, inputs: Record<string, unknown>, token?: string) => {
      if (path === cliAuth.createCompany) {
        calls.push({ method: "mutation", path, inputs, token });
        return Promise.reject(new ApiError("Bad Request", 400, { message: "Company name has already been taken" }));
      }

      return mockMutation(_baseUrl, path, inputs, token);
    };

    const result = await runCreateCompanyFlow(new Map(), emptyConfig, registryStub, deps);

    assert.strictEqual(result, 1);
    assert.ok(errorsPrinted.some((msg) => msg.includes("Company creation failed")));
    assert.ok(!askedPrompts.includes("Profile name (default: default):"));
    assert.ok(!fs.existsSync(path.join(tmpDir, ".operately", "config.json")));
  });
});

function readSavedConfig(tmpDir: string): {
  activeProfile: string;
  profiles: Record<string, { token?: string; name?: string; companyName?: string }>;
} {
  const configPath = path.join(tmpDir, ".operately", "config.json");
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}
