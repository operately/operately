import { describe, it, beforeEach } from "node:test";
import * as assert from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { executeAuthBootstrap } from "../../commands/auth-bootstrap";
import { ApiError } from "../../core/http";
import { cliAuth } from "../../core/paths";
import type { ChildProcess } from "child_process";

interface MockCall {
  method: "mutation" | "query" | "endpoint";
  path?: string;
  inputs: Record<string, unknown>;
  token?: string;
}

const calls: MockCall[] = [];
let responses: Array<unknown> = [];
let promptQueue: Array<unknown> = [];

function nextPrompt<T>(): Promise<T> {
  return Promise.resolve(promptQueue.shift() as T);
}

function nextResponse(): Promise<unknown> {
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
  calls.push({ method: "endpoint", inputs: args.inputs, token: args.token });
  return nextResponse();
}

function mockOpen(_url: string): Promise<ChildProcess | boolean | undefined> {
  return Promise.resolve(true);
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

describe("Auth Bootstrap", () => {
  let tmpDir: string;
  const errorsPrinted: string[] = [];
  const successPrinted: string[] = [];

  beforeEach(() => {
    calls.length = 0;
    responses = [];
    promptQueue = [];
    errorsPrinted.length = 0;
    successPrinted.length = 0;
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "op-cli-test-"));
  });

  function makeDeps() {
    return {
      askChoice: nextPrompt,
      askQuestion: nextPrompt,
      askPassword: nextPrompt,
      callInternalMutation: mockMutation,
      callInternalQuery: mockQuery,
      callEndpoint: mockEndpoint,
      openUrl: mockOpen,
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
      resolveRuntimeOptions: (_c: unknown, _o: unknown) => ({ baseUrl: "https://app.operately.com", token: null, timeoutMs: 30000, profile: "default" }),
    };
  }

  it("password flow with single company creates and saves token", async () => {
    promptQueue.push("password", "", "", "user@example.com", "secret123", false);

    responses.push({
      status: "authenticated",
      bootstrap_token: "bootstrap_xxx",
      companies: [{ id: "c1", name: "Acme Corp" }],
    });

    responses.push({
      token: "op_live_final_token",
      company: { id: "c1", name: "Acme Corp" },
    });

    responses.push({ me: { full_name: "Test User", email: "user@example.com" } });

    process.env.HOME = tmpDir;
    process.env.OPERATELY_API_TOKEN = "";
    process.env.OPERATELY_BASE_URL = "";
    process.env.OPERATELY_PROFILE = "";

    const result = await executeAuthBootstrap(
      new Map(),
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      makeDeps(),
    );

    assert.strictEqual(result, 0);
    const configPath = path.join(tmpDir, ".operately", "config.json");
    assert.ok(fs.existsSync(configPath));
    const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
    assert.strictEqual(saved.profiles.default.token, "op_live_final_token");
    assert.strictEqual(saved.profiles.default.baseUrl, undefined);

    assert.strictEqual(calls.length, 3);
    assert.strictEqual(calls[0].method, "mutation");
    assert.strictEqual(calls[0].path, cliAuth.authPassword);
    assert.strictEqual((calls[0].inputs as any).email, "user@example.com");
    assert.strictEqual(calls[1].method, "mutation");
    assert.strictEqual(calls[1].path, cliAuth.createToken);
    assert.strictEqual((calls[1].inputs as any).company_id, "c1");
    assert.strictEqual((calls[1].inputs as any).read_only, false);
    assert.strictEqual(calls[1].token, "bootstrap_xxx");
  });

  it("password flow with no companies returns error", async () => {
    promptQueue.push("password", "", "", "user@example.com", "secret123");

    responses.push({
      status: "no_companies",
      companies: [],
      message: "No companies available",
    });

    const result = await executeAuthBootstrap(
      new Map(),
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      makeDeps(),
    );

    assert.strictEqual(result, 1);
    assert.ok(errorsPrinted.some((e) => e.includes("No companies found")));
  });

  it("invalid credentials return exit code 4", async () => {
    promptQueue.push("password", "", "", "user@example.com", "wrongpass");

    const deps = makeDeps();
    deps.callInternalMutation = () => {
      return Promise.reject(new ApiError("Unauthorized", 401, { error: "Unauthorized" }));
    };

    const result = await executeAuthBootstrap(
      new Map(),
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      deps,
    );

    assert.strictEqual(result, 4);
    assert.ok(errorsPrinted.some((e) => e.includes("Invalid credentials")));
  });

  it("company selection prompts when multiple companies exist", async () => {
    promptQueue.push("password", "", "", "user@example.com", "secret123");
    promptQueue.push({ id: "c2", name: "Beta Inc" });
    promptQueue.push(true);

    responses.push({
      status: "authenticated",
      bootstrap_token: "bootstrap_xxx",
      companies: [
        { id: "c1", name: "Acme Corp" },
        { id: "c2", name: "Beta Inc" },
      ],
    });

    responses.push({
      token: "op_live_token",
      company: { id: "c2", name: "Beta Inc" },
    });

    responses.push({ me: { full_name: "Test User", email: "user@example.com" } });

    process.env.HOME = tmpDir;
    process.env.OPERATELY_API_TOKEN = "";
    process.env.OPERATELY_BASE_URL = "";
    process.env.OPERATELY_PROFILE = "";

    const result = await executeAuthBootstrap(
      new Map(),
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      makeDeps(),
    );

    assert.strictEqual(result, 0);
    assert.strictEqual(calls[1].method, "mutation");
    assert.strictEqual((calls[1].inputs as any).company_id, "c2");
  });

  it("google flow polls status and creates token", async () => {
    promptQueue.push("google", "", "", true);

    responses.push({
      status: "pending",
      bootstrap_token: "bootstrap_google",
      login_url: "https://example.com/auth",
      poll_interval_ms: 50,
    });

    responses.push({ status: "pending" });
    responses.push({
      status: "authenticated",
      companies: [{ id: "c1", name: "Acme Corp" }],
    });

    responses.push({ token: "op_google_token", company: { id: "c1" } });
    responses.push({ me: { full_name: "Google User", email: "google@example.com" } });

    process.env.HOME = tmpDir;

    const result = await executeAuthBootstrap(
      new Map(),
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      makeDeps(),
    );

    assert.strictEqual(result, 0);
    assert.strictEqual(calls[0].path, cliAuth.startGoogle);
    assert.strictEqual(calls[1].method, "query");
    assert.strictEqual(calls[1].path, cliAuth.status);
    assert.strictEqual(calls[1].token, "bootstrap_google");
  });

  it("expired google session returns exit code 4", async () => {
    promptQueue.push("google", "", "", true);

    responses.push({
      status: "pending",
      bootstrap_token: "bootstrap_google",
      login_url: "https://example.com/auth",
      poll_interval_ms: 50,
    });

    responses.push({ status: "expired" });

    const result = await executeAuthBootstrap(
      new Map(),
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      makeDeps(),
    );

    assert.strictEqual(result, 4);
    assert.ok(errorsPrinted.some((e) => e.includes("expired")));
  });

  it("token flow validates and saves token", async () => {
    promptQueue.push("token", "", "", "op_test_token");

    responses.push({ me: { full_name: "Token User", email: "token@example.com" } });

    process.env.HOME = tmpDir;

    const result = await executeAuthBootstrap(
      new Map(),
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      makeDeps(),
    );

    assert.strictEqual(result, 0);
    const configPath = path.join(tmpDir, ".operately", "config.json");
    assert.ok(fs.existsSync(configPath));
    const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
    assert.strictEqual(saved.profiles.default.token, "op_test_token");

    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].method, "endpoint");
    assert.strictEqual(calls[0].token, "op_test_token");
  });

  it("token flow invalid token returns exit code 4", async () => {
    promptQueue.push("token", "", "", "bad_token");

    const deps = makeDeps();
    deps.callEndpoint = () => {
      return Promise.reject(new ApiError("Unauthorized", 401, { error: "Unauthorized" }));
    };

    const result = await executeAuthBootstrap(
      new Map(),
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      deps,
    );

    assert.strictEqual(result, 4);
    assert.ok(errorsPrinted.some((e) => e.includes("Invalid token")));
  });

  it("base-url flag skips base-url prompt", async () => {
    promptQueue.push("token", "", "op_test_token");

    responses.push({ me: { full_name: "Token User", email: "token@example.com" } });

    process.env.HOME = tmpDir;

    const flags = new Map<string, unknown[]>();
    flags.set("base-url", ["https://custom.example.com"]);

    const result = await executeAuthBootstrap(
      flags,
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      makeDeps(),
    );

    assert.strictEqual(result, 0);
    const configPath = path.join(tmpDir, ".operately", "config.json");
    const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
    assert.strictEqual(saved.profiles.default.baseUrl, "https://custom.example.com");
    assert.strictEqual(calls[0].token, "op_test_token");
  });

  it("profile flag skips profile prompt", async () => {
    promptQueue.push("token", "", "op_test_token");

    responses.push({ me: { full_name: "Token User", email: "token@example.com" } });

    process.env.HOME = tmpDir;

    const flags = new Map<string, unknown[]>();
    flags.set("profile", ["work"]);

    const result = await executeAuthBootstrap(
      flags,
      { activeProfile: "default", profiles: {} },
      registryStub as any,
      makeDeps(),
    );

    assert.strictEqual(result, 0);
    const configPath = path.join(tmpDir, ".operately", "config.json");
    const saved = JSON.parse(fs.readFileSync(configPath, "utf8"));
    assert.strictEqual(saved.activeProfile, "work");
    assert.strictEqual(saved.profiles.work.token, "op_test_token");
  });
});
