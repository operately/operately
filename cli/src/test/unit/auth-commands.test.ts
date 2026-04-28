import { describe, it, beforeEach, afterEach } from "node:test";
import * as assert from "node:assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { executeAuthCommand } from "../../auth/commands";
import { runTokenFlow } from "../../auth/flows/login-token";
import { ApiError } from "../../core/http";

interface LogCapture {
  logs: string[];
  errors: string[];
}

function captureConsole(): LogCapture {
  const capture: LogCapture = { logs: [], errors: [] };
  const origLog = console.log;
  const origError = console.error;

  console.log = (msg?: unknown) => {
    capture.logs.push(String(msg));
  };
  console.error = (msg?: unknown) => {
    capture.errors.push(String(msg));
  };

  return capture;
}

function restoreConsole(): void {
  // We don't have the originals stored globally, but tests run in isolation.
  // In practice, node:test isolates each test file.
}

describe("Auth Commands", () => {
  let tmpDir: string;
  let origHome: string | undefined;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "op-auth-cmd-test-"));
    origHome = process.env.HOME;
    process.env.HOME = tmpDir;
    process.env.OPERATELY_API_TOKEN = "";
    process.env.OPERATELY_BASE_URL = "";
    process.env.OPERATELY_PROFILE = "";
  });

  afterEach(() => {
    process.env.HOME = origHome;
  });

  function writeConfig(config: { activeProfile: string; profiles: Record<string, unknown> }): void {
    const configDir = path.join(tmpDir, ".operately");
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, "config.json"), JSON.stringify(config, null, 2));
  }

  it("status shows logged in when token is configured", async () => {
    writeConfig({
      activeProfile: "default",
      profiles: {
        default: { token: "op_live_xxx", baseUrl: "https://custom.example.com" },
      },
    });

    const capture = captureConsole();
    const result = await executeAuthCommand({
      action: "status",
      flags: new Map(),
      registry: { find: () => null, byKey: new Map(), endpoints: [], commandFor: () => "" },
    });

    assert.strictEqual(result, 0);
    assert.ok(capture.logs.some((l) => l.includes("Profile: default")));
    assert.ok(capture.logs.some((l) => l.includes("Status: Logged in")));
    assert.ok(capture.logs.some((l) => l.includes("Base URL: https://custom.example.com")));
    assert.ok(capture.logs.some((l) => l.includes("Profile Base URL: https://custom.example.com")));
  });

  it("status shows not logged in when no token", async () => {
    writeConfig({ activeProfile: "default", profiles: {} });

    const capture = captureConsole();
    const result = await executeAuthCommand({
      action: "status",
      flags: new Map(),
      registry: { find: () => null, byKey: new Map(), endpoints: [], commandFor: () => "" },
    });

    assert.strictEqual(result, 0);
    assert.ok(capture.logs.some((l) => l.includes("Status: Not logged in")));
  });

  it("logout clears token from profile", async () => {
    writeConfig({
      activeProfile: "default",
      profiles: {
        default: { token: "op_live_xxx" },
      },
    });

    const capture = captureConsole();
    const result = await executeAuthCommand({
      action: "logout",
      flags: new Map(),
      registry: { find: () => null, byKey: new Map(), endpoints: [], commandFor: () => "" },
    });

    assert.strictEqual(result, 0);
    assert.ok(capture.logs.some((l) => l.includes("Logged out")));

    const saved = JSON.parse(
      fs.readFileSync(path.join(tmpDir, ".operately", "config.json"), "utf8"),
    );
    assert.strictEqual(saved.profiles.default.token, "");
  });

  it("logout returns error when not logged in", async () => {
    writeConfig({ activeProfile: "default", profiles: {} });

    const capture = captureConsole();
    const result = await executeAuthCommand({
      action: "logout",
      flags: new Map(),
      registry: { find: () => null, byKey: new Map(), endpoints: [], commandFor: () => "" },
    });

    assert.strictEqual(result, 1);
    assert.ok(capture.errors.some((e) => e.includes("Not logged in")));
  });
});

describe("runTokenFlow", () => {
  it("validates token and saves profile", async () => {
    let savedProfile: { token: string; baseUrl?: string } | null = null;

    const result = await runTokenFlow(
      "https://app.operately.com",
      30000,
      null,
      "default",
      { activeProfile: "default", profiles: {} },
      {
        find: () => ({
          full_name: "people/get_me",
          namespace: "people",
          name: "get_me",
          type: "query",
          method: "GET",
          path: "/api/external/v1/people/get_me",
          handler: "",
          inputs: [],
          outputs: [],
          docstring: null,
        }),
        byKey: new Map(),
        endpoints: [],
        commandFor: () => "",
      },
      {
        askQuestion: () => Promise.resolve("op_test_token"),
        callEndpoint: () => Promise.resolve({ me: { full_name: "Test User", email: "test@example.com" } }),
        saveProfile: (_config, _profile, data) => {
          savedProfile = data as { token: string; baseUrl?: string };
          return { activeProfile: "default", profiles: { default: data } };
        },
        writeConfig: () => {},
        printError: () => {},
        printSuccess: (msg: string) => {
          if (msg.includes("Logged in")) {
            // expected
          }
        },
      },
    );

    assert.strictEqual(result, 0);
    assert.ok(savedProfile);
    assert.strictEqual((savedProfile as { token: string }).token, "op_test_token");
  });

  it("returns exit code 4 for invalid token", async () => {
    const result = await runTokenFlow(
      "https://app.operately.com",
      30000,
      null,
      "default",
      { activeProfile: "default", profiles: {} },
      {
        find: () => ({
          full_name: "people/get_me",
          namespace: "people",
          name: "get_me",
          type: "query",
          method: "GET",
          path: "/api/external/v1/people/get_me",
          handler: "",
          inputs: [],
          outputs: [],
          docstring: null,
        }),
        byKey: new Map(),
        endpoints: [],
        commandFor: () => "",
      },
      {
        askQuestion: () => Promise.resolve("bad_token"),
        callEndpoint: () => Promise.reject(new ApiError("Unauthorized", 401, { error: "Unauthorized" })),
        saveProfile: () => ({ activeProfile: "default", profiles: {} }),
        writeConfig: () => {},
        printError: () => {},
        printSuccess: () => {},
      },
    );

    assert.strictEqual(result, 4);
  });

  it("returns exit code 5 when get_me endpoint is missing", async () => {
    const result = await runTokenFlow(
      "https://app.operately.com",
      30000,
      null,
      "default",
      { activeProfile: "default", profiles: {} },
      {
        find: () => null,
        byKey: new Map(),
        endpoints: [],
        commandFor: () => "",
      },
      {
        askQuestion: () => Promise.resolve("op_test_token"),
        callEndpoint: () => Promise.resolve({}),
        saveProfile: () => ({ activeProfile: "default", profiles: {} }),
        writeConfig: () => {},
        printError: () => {},
        printSuccess: () => {},
      },
    );

    assert.strictEqual(result, 5);
  });
});
