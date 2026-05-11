import { describe, it } from "node:test";
import * as assert from "node:assert";
import { runJoinInviteFlow } from "../../auth/flows/join-invite";
import { cliAuth, publicQuery } from "../../auth/shared/api";
import type { ChildProcess } from "child_process";

interface MockCall {
  method: "mutation" | "query" | "endpoint";
  path?: string;
  inputs: Record<string, unknown>;
  token?: string;
  timeoutMs?: number;
}

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

function createMockAskChoice(sequence: Array<"password" | "emailCode" | "google" | boolean | { id: string; name: string }>) {
  let index = 0;
  return async function askChoice<T>(
    prompt: string,
    _choices: { label: string; value: T }[],
  ): Promise<T> {
    askedPrompts.push(prompt);
    const val = sequence[index++];
    return val as T;
  };
}

function makeFlags(entries: Record<string, string>): Map<string, unknown[]> {
  const flags = new Map<string, unknown[]>();
  for (const [k, v] of Object.entries(entries)) {
    flags.set(k, [v]);
  }
  return flags;
}

const mockRegistry = {
  find: () => ({ id: "get_me", method: "query", path: ["people", "get_me"] }),
} as unknown as import("../../commands/registry").EndpointRegistry;

const emptyConfig = {
  profiles: {},
  activeProfile: "default",
};

describe("runJoinInviteFlow", () => {
  it("returns error for invalid invite token", async () => {
    calls.length = 0;
    responses = [{ invite_link: null }];
    promptQueue = ["my-token", "https://example.com", "default", "user@example.com", "password123"];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({}),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice([]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 1);
    assert.strictEqual(calls[0].path, publicQuery.getInviteLinkByToken);
    assert.strictEqual(calls[0].inputs["token"], "my-token");
  });

  it("uses password login for returning user on personal invite", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "personal" } },
      { invite_link: { company: { id: "company-1", name: "Test Co" } }, member: { email: "user@example.com", has_open_invitation: false } },
      { status: "authenticated", companies: [{ id: "company-1", name: "Test Co" }], bootstrap_token: "bt-123" },
      { token: "api-123", company: { id: "company-1", name: "Test Co" } },
      { me: { full_name: "User", email: "user@example.com" } },
    ];
    promptQueue = ["my-token", "https://example.com", "default", "user@example.com", "password123"];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({}),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice(["password"]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: (msg: string) => {
          throw new Error(`printError called: ${msg}`);
        },
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 0);

    const authPasswordCall = calls.find((c) => c.path === cliAuth.authPassword);
    assert.ok(authPasswordCall, "Expected auth_password call");
    assert.deepStrictEqual(authPasswordCall.inputs, {
      email: "user@example.com",
      password: "password123",
      invite_token: "my-token",
    });

    const createTokenCall = calls.find((c) => c.path === cliAuth.createToken);
    assert.ok(createTokenCall, "Expected create_token call");
    assert.strictEqual(createTokenCall!.inputs["company_id"], "company-1");
    assert.strictEqual(createTokenCall!.inputs["read_only"], false);
  });

  it("uses first-time password setup for new user on personal invite", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "personal" } },
      { invite_link: { company: { id: "company-1", name: "Test Co" } }, member: { email: "new@example.com", has_open_invitation: true } },
      { status: "authenticated", bootstrap_token: "bt-456" },
      { token: "api-456", company: { id: "company-1", name: "Test Co" } },
      { me: { full_name: "New User", email: "new@example.com" } },
    ];
    promptQueue = ["my-token", "https://example.com", "default", "password1", "password1"];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({}),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice(["password"]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 0);

    const joinCall = calls.find((c) => c.path === cliAuth.joinCompany);
    assert.ok(joinCall, "Expected join_company call");
    assert.strictEqual(joinCall!.inputs["token"], "my-token");
    assert.strictEqual(joinCall!.inputs["password"], "password1");
    assert.strictEqual(joinCall!.inputs["password_confirmation"], "password1");

    const createTokenCall = calls.find((c) => c.path === cliAuth.createToken);
    assert.ok(createTokenCall, "Expected create_token call");
    assert.strictEqual(createTokenCall!.inputs["company_id"], "company-1");
    assert.strictEqual(createTokenCall!.inputs["read_only"], false);
  });

  it("uses google flow for personal invite", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "personal" } },
      { invite_link: { company: { id: "company-1", name: "Test Co" } }, member: { email: "user@example.com", has_open_invitation: true } },
      { status: "pending", bootstrap_token: "bt-789", login_url: "https://example.com/cli-login/123", poll_interval_ms: 1000 },
      { status: "authenticated", companies: [{ id: "company-1", name: "Test Co" }] },
      { token: "api-789", company: { id: "company-1", name: "Test Co" } },
      { me: { full_name: "User", email: "user@example.com" } },
    ];
    promptQueue = ["my-token", "https://example.com", "default"];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({}),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice(["google"]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 0);

    const startGoogleCall = calls.find((c) => c.path === cliAuth.startGoogle);
    assert.ok(startGoogleCall, "Expected start_google call");
    assert.strictEqual(startGoogleCall!.inputs["invite_token"], "my-token");

    const createTokenCall = calls.find((c) => c.path === cliAuth.createToken);
    assert.ok(createTokenCall, "Expected create_token call");
    assert.strictEqual(createTokenCall!.inputs["company_id"], "company-1");
    assert.strictEqual(createTokenCall!.inputs["read_only"], false);
  });

  it("uses email-code flow for returning user on personal invite without prompting for email", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "personal" } },
      { invite_link: { company: { id: "company-1", name: "Test Co" } }, member: { email: "user@example.com", has_open_invitation: false } },
      {},
      { status: "authenticated", companies: [{ id: "company-1", name: "Test Co" }], bootstrap_token: "bt-email-personal" },
      { token: "api-email-personal", company: { id: "company-1", name: "Test Co" } },
      { me: { full_name: "User", email: "user@example.com" } },
    ];
    promptQueue = ["my-token", "https://example.com", "default", "ABC123"];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({}),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice(["emailCode"]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 0);
    assert.ok(!askedPrompts.includes("Email:"), "Returning personal invite should not prompt for email");

    const requestCodeCall = calls.find((c) => c.path === cliAuth.requestEmailCode);
    assert.ok(requestCodeCall, "Expected request_email_code call");
    assert.deepStrictEqual(requestCodeCall!.inputs, {
      email: "user@example.com",
    });

    const authCodeCall = calls.find((c) => c.path === cliAuth.authEmailCode);
    assert.ok(authCodeCall, "Expected auth_email_code call");
    assert.deepStrictEqual(authCodeCall!.inputs, {
      email: "user@example.com",
      code: "ABC123",
      invite_token: "my-token",
    });
  });

  it("uses password flags for a returning personal invite so no auth prompts are required", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "personal" } },
      { invite_link: { company: { id: "company-1", name: "Test Co" } }, member: { email: "user@example.com", has_open_invitation: false } },
      { status: "authenticated", companies: [{ id: "company-1", name: "Test Co" }], bootstrap_token: "bt-flags-personal" },
      { token: "api-flags-personal", company: { id: "company-1", name: "Test Co" } },
      { me: { full_name: "User", email: "user@example.com" } },
    ];
    promptQueue = [];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({
        "invite-token": "flag-token",
        "base-url": "https://example.com",
        profile: "default",
        method: "password",
        email: "user@example.com",
        password: "password123",
      }),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice([]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 0);
    assert.deepStrictEqual(askedPrompts, []);

    const authPasswordCall = calls.find((c) => c.path === cliAuth.authPassword);
    assert.ok(authPasswordCall);
    assert.deepStrictEqual(authPasswordCall!.inputs, {
      email: "user@example.com",
      password: "password123",
      invite_token: "flag-token",
    });
  });

  it("uses email-code flags for a returning personal invite so only the verification code prompt remains", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "personal" } },
      { invite_link: { company: { id: "company-1", name: "Test Co" } }, member: { email: "user@example.com", has_open_invitation: false } },
      {},
      { status: "authenticated", companies: [{ id: "company-1", name: "Test Co" }], bootstrap_token: "bt-email-flags-personal" },
      { token: "api-email-flags-personal", company: { id: "company-1", name: "Test Co" } },
      { me: { full_name: "User", email: "user@example.com" } },
    ];
    promptQueue = ["ABC123"];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({
        "invite-token": "flag-token",
        "base-url": "https://example.com",
        profile: "default",
        method: "email-code",
        email: "user@example.com",
      }),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice([]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 0);
    assert.deepStrictEqual(askedPrompts, ["A verification code was sent to your email. Enter the code:"]);
  });

  it("uses a password flag for first-time personal invites and skips confirmation prompts", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "personal" } },
      { invite_link: { company: { id: "company-1", name: "Test Co" } }, member: { email: "new@example.com", has_open_invitation: true } },
      { status: "authenticated", bootstrap_token: "bt-first-time-flags" },
      { token: "api-first-time-flags", company: { id: "company-1", name: "Test Co" } },
      { me: { full_name: "New User", email: "new@example.com" } },
    ];
    promptQueue = [];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({
        "invite-token": "flag-token",
        "base-url": "https://example.com",
        profile: "default",
        method: "password",
        password: "password1",
      }),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice([]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 0);
    assert.deepStrictEqual(askedPrompts, []);

    const joinCall = calls.find((c) => c.path === cliAuth.joinCompany);
    assert.ok(joinCall);
    assert.deepStrictEqual(joinCall!.inputs, {
      token: "flag-token",
      password: "password1",
      password_confirmation: "password1",
    });
  });

  it("uses google flow for company-wide invite", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "company_wide", company: { id: "company-1", name: "Test Co" } } },
      { status: "pending", bootstrap_token: "bt-789", login_url: "https://example.com/cli-login/123", poll_interval_ms: 1000 },
      { status: "authenticated", companies: [{ id: "company-1", name: "Test Co" }] },
      { token: "api-789", company: { id: "company-1", name: "Test Co" } },
      { me: { full_name: "User", email: "user@example.com" } },
    ];
    promptQueue = ["my-token", "https://example.com", "default"];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({}),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice(["google"]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 0);

    const startGoogleCall = calls.find((c) => c.path === cliAuth.startGoogle);
    assert.ok(startGoogleCall, "Expected start_google call");
    assert.strictEqual(startGoogleCall!.inputs["invite_token"], "my-token");

    const createTokenCall = calls.find((c) => c.path === cliAuth.createToken);
    assert.ok(createTokenCall, "Expected create_token call");
    assert.strictEqual(createTokenCall!.inputs["company_id"], "company-1");
    assert.strictEqual(createTokenCall!.inputs["read_only"], false);
  });

  it("uses email-code flow for company-wide invite", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "company_wide", company: { id: "company-1", name: "Test Co" } } },
      {},
      { status: "authenticated", companies: [{ id: "company-1", name: "Test Co" }], bootstrap_token: "bt-email-company" },
      { token: "api-email-company", company: { id: "company-1", name: "Test Co" } },
      { me: { full_name: "User", email: "user@example.com" } },
    ];
    promptQueue = ["my-token", "https://example.com", "default", "user@example.com", "ABC123"];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({}),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice(["emailCode"]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 0);

    const requestCodeCall = calls.find((c) => c.path === cliAuth.requestEmailCode);
    assert.ok(requestCodeCall, "Expected request_email_code call");
    assert.deepStrictEqual(requestCodeCall!.inputs, {
      email: "user@example.com",
    });

    const authCodeCall = calls.find((c) => c.path === cliAuth.authEmailCode);
    assert.ok(authCodeCall, "Expected auth_email_code call");
    assert.deepStrictEqual(authCodeCall!.inputs, {
      email: "user@example.com",
      code: "ABC123",
      invite_token: "my-token",
    });
  });

  it("uses company-wide password flags so no auth prompts are required", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "company_wide", company: { id: "company-1", name: "Test Co" } } },
      { status: "authenticated", companies: [{ id: "company-1", name: "Test Co" }], bootstrap_token: "bt-company-flags" },
      { token: "api-company-flags", company: { id: "company-1", name: "Test Co" } },
      { me: { full_name: "User", email: "user@example.com" } },
    ];
    promptQueue = [];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({
        "invite-token": "flag-token",
        "base-url": "https://example.com",
        profile: "default",
        method: "password",
        email: "user@example.com",
        password: "password123",
        "company-name": "Test Co",
      }),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice([]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 0);
    assert.deepStrictEqual(askedPrompts, []);
  });

  it("rejects an unsupported --method value", async () => {
    calls.length = 0;
    responses = [];
    promptQueue = [];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({ method: "github" }),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice([]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 2);
    assert.deepStrictEqual(calls, []);
  });

  it("rejects google join when email flags are also passed", async () => {
    calls.length = 0;
    responses = [];
    promptQueue = [];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({ method: "google", email: "user@example.com" }),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice([]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 2);
    assert.deepStrictEqual(calls, []);
  });

  it("rejects email-code for first-time personal invites", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "personal" } },
      { invite_link: { company: { id: "company-1", name: "Test Co" } }, member: { email: "new@example.com", has_open_invitation: true } },
    ];
    promptQueue = [];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({
        "invite-token": "flag-token",
        "base-url": "https://example.com",
        profile: "default",
        method: "email-code",
      }),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice([]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 2);
  });

  it("does not offer email-code for first-time personal invites", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "personal" } },
      { invite_link: { company: { id: "company-1", name: "Test Co" } }, member: { email: "new@example.com", has_open_invitation: true } },
      { status: "pending", bootstrap_token: "bt-789", login_url: "https://example.com/cli-login/123", poll_interval_ms: 1000 },
      { status: "authenticated", companies: [{ id: "company-1", name: "Test Co" }] },
      { token: "api-789", company: { id: "company-1", name: "Test Co" } },
      { me: { full_name: "User", email: "new@example.com" } },
    ];
    promptQueue = ["my-token", "https://example.com", "default"];
    askedPrompts = [];

    let availableChoices: string[] = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({}),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: async <T>(_prompt: string, choices: { label: string; value: T }[]): Promise<T> => {
          availableChoices = choices.map((choice) => choice.label);
          return "google" as T;
        },
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 0);
    assert.deepStrictEqual(availableChoices, [
      "Email and password",
      "Google OAuth (opens browser)",
    ]);
  });

  it("uses --invite-token flag without prompting", async () => {
    calls.length = 0;
    responses = [
      { invite_link: { type: "company_wide", company: { id: "company-1", name: "Test Co" } } },
      { status: "pending", bootstrap_token: "bt-000", login_url: "https://example.com/cli-login/000", poll_interval_ms: 1000 },
      { status: "authenticated", companies: [{ id: "company-1", name: "Test Co" }] },
      { token: "api-000", company: { id: "company-1", name: "Test Co" } },
      { me: { full_name: "User", email: "user@example.com" } },
    ];
    promptQueue = ["https://example.com", "default"];
    askedPrompts = [];

    const exitCode = await runJoinInviteFlow(
      makeFlags({ "invite-token": "flag-token" }),
      emptyConfig,
      mockRegistry,
      {
        askQuestion: nextPrompt,
        askPassword: nextPrompt,
        askChoice: createMockAskChoice(["google"]),
        callInternalMutation: mockMutation,
        callInternalQuery: mockQuery,
        callEndpoint: mockEndpoint,
        openUrl: mockOpen,
        printError: () => {},
        printInfo: () => {},
        printSuccess: () => {},
        saveProfile: (c) => c,
        writeConfig: () => {},
        resolveRuntimeOptions: (_c, opts) => ({
          baseUrl: opts.baseUrl || "https://app.operately.com",
          token: opts.token || null,
          profile: opts.profile || "default",
          timeoutMs: 30000,
        }),
      },
    );

    assert.strictEqual(exitCode, 0);

    const tokenCheck = calls.find((c) => c.path === publicQuery.getInviteLinkByToken);
    assert.ok(tokenCheck, "Expected get_invite_link_by_token call");
    assert.strictEqual(tokenCheck!.inputs["token"], "flag-token");
    assert.ok(!askedPrompts.includes("Invite token:"), "Invite token prompt should be skipped when --invite-token is provided");

    const createTokenCall = calls.find((c) => c.path === cliAuth.createToken);
    assert.ok(createTokenCall, "Expected create_token call");
    assert.strictEqual(createTokenCall!.inputs["company_id"], "company-1");
    assert.strictEqual(createTokenCall!.inputs["read_only"], false);
  });
});
