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
        default: {
          token: "op_live_xxx",
          baseUrl: "https://custom.example.com",
          name: "Jane Admin",
          companyName: "Acme Corp",
        },
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
    assert.ok(capture.logs.some((l) => l.includes("Name: Jane Admin")));
    assert.ok(capture.logs.some((l) => l.includes("Company: Acme Corp")));
    assert.ok(capture.logs.some((l) => l.includes("Base URL: https://custom.example.com")));
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

  it("profiles shows an empty state when no profiles are saved", async () => {
    writeConfig({ activeProfile: "default", profiles: {} });

    const capture = captureConsole();
    const result = await executeAuthCommand({
      action: "profiles",
      flags: new Map(),
      registry: { find: () => null, byKey: new Map(), endpoints: [], commandFor: () => "" },
    });

    assert.strictEqual(result, 0);
    assert.ok(capture.logs.includes("No saved CLI profiles."));
    assert.ok(capture.logs.some((l) => l.includes("operately auth login")));
    assert.ok(capture.logs.some((l) => l.includes("operately auth create-company")));
  });

  it("profiles lists saved profiles with active profile first and metadata", async () => {
    writeConfig({
      activeProfile: "default",
      profiles: {
        staging: {
          token: "",
          baseUrl: "https://staging.example.com",
        },
        default: {
          token: "op_live_xxx",
          name: "Jane Admin",
          companyName: "Acme Corp",
        },
        local: {
          token: "op_local_xxx",
          baseUrl: "http://localhost:4000",
          name: "Local User",
        },
      },
    });

    const capture = captureConsole();
    const result = await executeAuthCommand({
      action: "profiles",
      flags: new Map(),
      registry: { find: () => null, byKey: new Map(), endpoints: [], commandFor: () => "" },
    });

    assert.strictEqual(result, 0);
    assert.ok(capture.logs.includes("Saved CLI profiles:"));

    const defaultIndex = capture.logs.findIndex((l) => l.includes("* default (active)"));
    const localIndex = capture.logs.findIndex((l) => l.includes("- local"));
    const stagingIndex = capture.logs.findIndex((l) => l.includes("- staging"));

    assert.ok(defaultIndex > -1);
    assert.ok(localIndex > -1);
    assert.ok(stagingIndex > -1);
    assert.ok(defaultIndex < localIndex);
    assert.ok(localIndex < stagingIndex);

    assert.ok(capture.logs.some((l) => l.includes("Status: Logged in")));
    assert.ok(capture.logs.some((l) => l.includes("Status: Not logged in")));
    assert.ok(capture.logs.some((l) => l.includes("Name: Jane Admin")));
    assert.ok(capture.logs.some((l) => l.includes("Company: Acme Corp")));
    assert.ok(capture.logs.some((l) => l.includes("Base URL: https://app.operately.com")));
    assert.ok(capture.logs.some((l) => l.includes("Base URL: https://staging.example.com")));
    assert.ok(capture.logs.some((l) => l.includes("Base URL: http://localhost:4000")));
    assert.ok(capture.logs.some((l) => l.includes("Use `--profile <name>` with any command")));
  });

  it("profiles trims active profile before marking it active", async () => {
    writeConfig({
      activeProfile: " default ",
      profiles: {
        default: {
          token: "op_live_xxx",
        },
        staging: {
          token: "",
        },
      },
    });

    const capture = captureConsole();
    const result = await executeAuthCommand({
      action: "profiles",
      flags: new Map(),
      registry: { find: () => null, byKey: new Map(), endpoints: [], commandFor: () => "" },
    });

    assert.strictEqual(result, 0);
    assert.ok(capture.logs.some((l) => l.includes("* default (active)")));
    assert.ok(!capture.logs.some((l) => l.includes("- default")));
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
    let savedProfile: { token: string; baseUrl?: string; name?: string; companyName?: string } | null = null;

    const result = await runTokenFlow(
      "https://app.operately.com",
      30000,
      null,
      "default",
      { activeProfile: "default", profiles: {} },
      {
        find: (parts: string[]) => {
          if (parts.join("/") === "people/get_me") {
            return {
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
            };
          }

          if (parts.join("/") === "companies/get") {
            return {
              full_name: "companies/get",
              namespace: "companies",
              name: "get",
              type: "query",
              method: "GET",
              path: "/api/external/v1/companies/get",
              handler: "",
              inputs: [],
              outputs: [],
              docstring: null,
            };
          }

          return null;
        },
        byKey: new Map(),
        endpoints: [],
        commandFor: () => "",
      },
      {
        askQuestion: () => Promise.resolve("op_test_token"),
        callEndpoint: (args) => {
          if (args.endpoint.path === "/api/external/v1/people/get_me") {
            return Promise.resolve({ me: { full_name: "Test User", email: "test@example.com" } });
          }

          return Promise.resolve({ company: { name: "Acme Corp" } });
        },
        saveProfile: (_config, _profile, data) => {
          savedProfile = data as { token: string; baseUrl?: string; name?: string; companyName?: string };
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
    assert.notStrictEqual(savedProfile, null);

    const profileData = savedProfile as { token: string; baseUrl?: string; name?: string; companyName?: string };

    assert.strictEqual(profileData.token, "op_test_token");
    assert.strictEqual(profileData.name, "Test User");
    assert.strictEqual(profileData.companyName, "Acme Corp");
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
