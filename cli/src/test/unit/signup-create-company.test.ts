import { describe, it, beforeEach, afterEach } from "node:test";
import * as assert from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { runSignupCreateCompanyFlow } from "../../auth/flows/signup-create-company";
import { ApiError } from "../../core/http";
import { cliAuth } from "../../auth/shared/api";

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

function nextPrompt<T>(..._args: unknown[]): Promise<T> {
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

// Registry stub
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
};

describe("Signup Create Company Flow", () => {
  let tmpDir: string;
  const errorsPrinted: string[] = [];
  const successPrinted: string[] = [];

  beforeEach(() => {
    calls.length = 0;
    responses = [];
    promptQueue = [];
    errorsPrinted.length = 0;
    successPrinted.length = 0;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "op-cli-signup-test-"));
  });

  afterEach(() => {
    assert.strictEqual(promptQueue.length, 0, `promptQueue not empty: ${JSON.stringify(promptQueue)}`);
    assert.strictEqual(responses.length, 0, `responses not empty: ${JSON.stringify(responses)}`);
  });

  function makeDeps() {
    return {
      askChoice: nextPrompt as AskChoiceFn,
      askQuestion: nextPrompt as AskQuestionFn,
      askPassword: nextPrompt as AskPasswordFn,
      callInternalMutation: mockMutation,
      callEndpoint: mockEndpoint,
      printError: (msg: string) => errorsPrinted.push(msg),
      printSuccess: (msg: string) => successPrinted.push(msg),
      saveProfile: (_c: unknown, profile: string, data: { token?: string; baseUrl?: string }) => {
        const cfg = { activeProfile: profile, profiles: { [profile]: data } };
        return cfg;
      },
      writeConfig: (cfg: { activeProfile: string; profiles: Record<string, unknown> }) => {
        const configDir = path.join(tmpDir, ".operately");
        if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
        fs.writeFileSync(path.join(configDir, "config.json"), JSON.stringify(cfg, null, 2));
      },
      resolveRuntimeOptions: (_c: unknown, _o: unknown) => ({
        baseUrl: "https://app.operately.com",
        token: null,
        timeoutMs: 30000,
        profile: "default",
      }),
    };
  }

  it("successful signup and create company flow", async () => {
    // Prompt queue: email, base-url, profile, code, full_name, password, company_name, access_mode
    promptQueue.push("newuser@example.com", "", "", "ABC123", "New User", "secret123456", "Acme Corp", false);

    // check_account response
    responses.push({ exists: false });
    // create_email_activation_code response (no body needed)
    responses.push({});
    // signup response
    responses.push({
      status: "no_companies",
      companies: [],
      bootstrap_token: "bootstrap_xxx",
      message: "not a member of any companies",
    });
    // create_company response
    responses.push({ company: { id: "c1", name: "Acme Corp" }, person: { id: "p1", full_name: "New User" } });
    // status response after company creation
    responses.push({
      status: "authenticated",
      companies: [{ id: "c1", name: "Acme Corp" }],
    });
    // create_token response
    responses.push({ token: "op_live_final_token", company: { id: "c1", name: "Acme Corp" } });
    // get_me response
    responses.push({ me: { full_name: "New User", email: "newuser@example.com" } });

    process.env.HOME = tmpDir;

    const result = await runSignupCreateCompanyFlow(
      new Map(),
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      makeDeps(),
    );

    assert.strictEqual(result, 0);
    assert.ok(successPrinted.some((s) => s.includes("Logged in")), "Expected success message about logged in");

    assert.strictEqual(calls.length, 7);
    // 0: check_account
    assert.strictEqual(calls[0].method, "mutation");
    assert.strictEqual(calls[0].path, cliAuth.checkAccount);
    assert.strictEqual((calls[0].inputs as any).email, "newuser@example.com");

    // 1: create_email_activation_code
    assert.strictEqual(calls[1].method, "mutation");
    assert.strictEqual(calls[1].path, "/create_email_activation_code");

    // 2: signup
    assert.strictEqual(calls[2].method, "mutation");
    assert.strictEqual(calls[2].path, cliAuth.signup);
    assert.strictEqual((calls[2].inputs as any).email, "newuser@example.com");
    assert.strictEqual((calls[2].inputs as any).code, "ABC123");
    assert.strictEqual((calls[2].inputs as any).full_name, "New User");
    assert.strictEqual((calls[2].inputs as any).password, "secret123456");

    // 3: create_company
    assert.strictEqual(calls[3].method, "mutation");
    assert.strictEqual(calls[3].path, cliAuth.createCompany);
    assert.strictEqual((calls[3].inputs as any).company_name, "Acme Corp");
    assert.strictEqual(calls[3].token, "bootstrap_xxx");

    // 4: status
    assert.strictEqual(calls[4].method, "mutation");
    assert.strictEqual(calls[4].path, cliAuth.status);
    assert.strictEqual(calls[4].token, "bootstrap_xxx");

    // 5: create_token
    assert.strictEqual(calls[5].method, "mutation");
    assert.strictEqual(calls[5].path, cliAuth.createToken);
    assert.strictEqual((calls[5].inputs as any).company_id, "c1");
    assert.strictEqual((calls[5].inputs as any).read_only, false);
    assert.strictEqual(calls[5].token, "bootstrap_xxx");

    // 6: get_me endpoint
    assert.strictEqual(calls[6].method, "endpoint");
    assert.strictEqual(calls[6].token, "op_live_final_token");

    const configPath = path.join(tmpDir, ".operately", "config.json");
    assert.ok(fs.existsSync(configPath));
    const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
    assert.strictEqual(saved.profiles.default.token, "op_live_final_token");
  });

  it("rejects signup when account already exists", async () => {
    promptQueue.push("existing@example.com", "", "");

    responses.push({ exists: true });

    const result = await runSignupCreateCompanyFlow(
      new Map(),
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      makeDeps(),
    );

    assert.strictEqual(result, 1);
    assert.ok(errorsPrinted.some((e) => e.includes("already exists")));
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].path, cliAuth.checkAccount);
  });

  it("handles server error during check_account", async () => {
    promptQueue.push("newuser@example.com", "", "");

    const deps = makeDeps();
    deps.callInternalMutation = () => {
      return Promise.reject(new ApiError("Server Error", 500, { message: "Internal Server Error" }));
    };

    const result = await runSignupCreateCompanyFlow(
      new Map(),
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      deps,
    );

    assert.strictEqual(result, 5);
    assert.ok(errorsPrinted.some((e) => e.includes("Server error")));
  });

  it("handles 403 from create_company on non-empty instance", async () => {
    promptQueue.push("newuser@example.com", "", "", "ABC123", "New User", "secret123456", "Acme Corp");

    responses.push({ exists: false });
    responses.push({});
    responses.push({
      status: "no_companies",
      companies: [],
      bootstrap_token: "bootstrap_xxx",
      message: "not a member of any companies",
    });

    const deps = makeDeps();
    deps.callInternalMutation = (_baseUrl: string, path: string, _inputs: Record<string, unknown>, _token?: string) => {
      calls.push({ method: "mutation", path, inputs: _inputs, token: _token });
      if (path === cliAuth.createCompany) {
        return Promise.reject(new ApiError("Forbidden", 403, { message: "Companies already exist" }));
      }
      return nextResponse();
    };

    const result = await runSignupCreateCompanyFlow(
      new Map(),
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      deps,
    );

    assert.strictEqual(result, 1);
    assert.ok(errorsPrinted.some((e) => e.includes("already has one or more companies")));
    assert.ok(errorsPrinted.some((e) => e.includes("Join a company with an invite")));
  });
});
