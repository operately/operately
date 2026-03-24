import { describe, it } from "node:test";
import * as assert from "node:assert";
import { spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

interface CLIResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

const testHome = fs.mkdtempSync(path.join(os.tmpdir(), "operately-cli-test-"));

async function runCLI(args: string[]): Promise<CLIResult> {
  return new Promise((resolve) => {
    const cliPath = path.join(__dirname, "../index.js");
    const child = spawn("node", [cliPath, ...args], {
      env: {
        ...process.env,
        HOME: testHome,
        OPERATELY_API_TOKEN: "",
        OPERATELY_BASE_URL: "",
        OPERATELY_PROFILE: "",
      },
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

describe("CLI Integration Tests", () => {
  describe("Command Routing", () => {
    it("shows general help when no command is provided", async () => {
      const result = await runCLI([]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Operately CLI"));
      assert.ok(result.stdout.includes("Usage:"));
    });

    it("shows version with --version flag", async () => {
      const result = await runCLI(["--version"]);
      assert.strictEqual(result.exitCode, 0);
      assert.match(result.stdout.trim(), /^\d+\.\d+\.\d+$/);
    });

    it("shows namespace help when namespace is called without subcommand", async () => {
      const result = await runCLI(["comments"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("comments namespace"));
      assert.ok(result.stdout.includes("Available commands:"));
      assert.ok(result.stdout.includes("create"));
    });

    it("shows namespace help with --help flag", async () => {
      const result = await runCLI(["projects", "--help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("projects namespace"));
    });

    it("shows namespace help with trailing help", async () => {
      const result = await runCLI(["projects", "help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("projects namespace"));
    });

    it("shows command help with --help flag", async () => {
      const result = await runCLI(["projects", "list", "--help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Command: projects list"));
      assert.ok(result.stdout.includes("Input flags:"));
    });

    it("shows command help with trailing help", async () => {
      const result = await runCLI(["projects", "update_due_date", "help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Command: projects update_due_date"));
      assert.ok(result.stdout.includes("Input flags:"));
    });

    it("shows error for unknown command", async () => {
      const result = await runCLI(["unknown-command"]);
      assert.strictEqual(result.exitCode, 2);
      assert.ok(result.stderr.includes("Unknown command"));
    });
  });

  describe("Auth Commands", () => {
    it("shows auth help when 'auth' is called without subcommand", async () => {
      const result = await runCLI(["auth"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Authentication"));
      assert.ok(result.stdout.includes("login"));
      assert.ok(result.stdout.includes("status"));
    });

    it("shows auth help when 'auth help' is used", async () => {
      const result = await runCLI(["auth", "help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Authentication"));
      assert.ok(result.stdout.includes("login"));
    });

    it("shows auth status with user-friendly format", async () => {
      const result = await runCLI(["auth", "status"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Profile:"));
      assert.ok(result.stdout.includes("Status:"));
      assert.ok(!result.stdout.includes("token_configured"));
    });

    it("shows error for invalid auth command", async () => {
      const result = await runCLI(["auth", "invalid"]);
      assert.strictEqual(result.exitCode, 2);
      const output = result.stdout + result.stderr;
      assert.ok(output.includes("Invalid auth command"));
    });
  });

  describe("Flag Parsing", () => {
    it("accepts ISO date flags for contextual date inputs", async () => {
      const result = await runCLI(["goals", "update_due_date", "--goal-id", "g1", "--due-date", "2026-03-20"]);
      assert.strictEqual(result.exitCode, 3);
      assert.ok(result.stderr.includes("Missing API token"));
      assert.ok(!result.stderr.includes("Expected object for 'due_date'"));
    });

    it("accepts boolean flag with =true", async () => {
      const result = await runCLI(["auth", "status", "--verbose=true"]);
      assert.strictEqual(result.exitCode, 0);
    });

    it("accepts boolean flag with =false", async () => {
      const result = await runCLI(["auth", "status", "--verbose=false"]);
      assert.strictEqual(result.exitCode, 0);
    });

    it("accepts string flag with equals syntax", async () => {
      const result = await runCLI(["auth", "status", "--profile=test"]);
      assert.strictEqual(result.exitCode, 0);
    });

    it("accepts flags before command", async () => {
      const result = await runCLI(["--help", "projects"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("projects"));
    });

    it("accepts flags after command", async () => {
      const result = await runCLI(["projects", "--help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("projects"));
    });
  });

  describe("Type Information in Help", () => {
    it("shows required fields", async () => {
      const result = await runCLI(["help", "spaces", "create"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("--name"));
      assert.ok(result.stdout.includes("required"));
    });

    it("shows nullable fields", async () => {
      const result = await runCLI(["help", "projects", "create"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("nullable"));
    });

    it("shows optional fields", async () => {
      const result = await runCLI(["help", "projects", "list"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("optional"));
    });

    it("shows contextual date format information in help", async () => {
      const result = await runCLI(["help", "projects", "update_due_date"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("--due-date"));
      assert.ok(result.stdout.includes("Formats:"));
      assert.ok(result.stdout.includes("YYYY-MM-DD"));
      assert.ok(result.stdout.includes("YYYY/q#"));
      assert.ok(result.stdout.includes("YYYY/MM"));
    });

    it("shows contextual date examples in help", async () => {
      const result = await runCLI(["help", "projects", "update_due_date"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("2025-03-20"));
      assert.ok(result.stdout.includes("2025/q1"));
      assert.ok(result.stdout.includes("2025/01"));
    });

    it("shows string enum values in help", async () => {
      const result = await runCLI(["help", "comments", "create"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("--entity-type"));
      assert.ok(result.stdout.includes("Allowed values:"));
      assert.ok(result.stdout.includes("project_check_in"));
      assert.ok(result.stdout.includes("goal_update"));
      assert.ok(result.stdout.includes("milestone"));
    });

    it("shows integer enum values in help", async () => {
      const result = await runCLI(["help", "projects", "create"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("--anonymous-access-level"));
      assert.ok(result.stdout.includes("Allowed values:"));
      assert.ok(result.stdout.includes("0"));
      assert.ok(result.stdout.includes("100"));
    });

    it("shows type hints for all fields", async () => {
      const result = await runCLI(["help", "projects", "create"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("<id>"));
      assert.ok(result.stdout.includes("<string>"));
      assert.ok(result.stdout.includes("<access_options_int>"));
    });

    it("shows markdown format for json fields", async () => {
      const result = await runCLI(["help", "projects", "update_description"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("<markdown>"));
      assert.ok(result.stdout.includes("Markdown Format:"));
      assert.ok(result.stdout.includes("Headings: # H1"));
      assert.ok(result.stdout.includes("Bold: **text**"));
      assert.ok(result.stdout.includes("Lists: - item"));
    });

    it("shows markdown help for all json type fields", async () => {
      const result = await runCLI(["help", "comments", "create"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("--content"));
    });
  });

  describe("Backward Compatibility", () => {
    it("namespace without subcommand shows help (same as --help)", async () => {
      const withoutHelp = await runCLI(["goals"]);
      const withHelp = await runCLI(["goals", "--help"]);

      assert.strictEqual(withoutHelp.exitCode, 0);
      assert.strictEqual(withHelp.exitCode, 0);
      assert.ok(withoutHelp.stdout.includes("goals namespace"));
      assert.ok(withHelp.stdout.includes("goals namespace"));
    });

    it("boolean flags accept string values true/false", async () => {
      const resultTrue = await runCLI(["auth", "status", "--verbose=true"]);
      const resultFalse = await runCLI(["auth", "status", "--verbose=false"]);

      assert.strictEqual(resultTrue.exitCode, 0);
      assert.strictEqual(resultFalse.exitCode, 0);
    });

    it("auth commands show user-friendly messages", async () => {
      const result = await runCLI(["auth", "status"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Profile:"));
      assert.ok(!result.stdout.includes("token_configured"));
    });
  });

  describe("Error Handling", () => {
    it("shows error for missing command after flags", async () => {
      const result = await runCLI(["--token", "test"]);
      assert.strictEqual(result.exitCode, 2);
      const output = result.stdout + result.stderr;
      assert.ok(output.includes("Missing command"));
    });

    it("shows error for unknown subcommand", async () => {
      const result = await runCLI(["projects", "nonexistent"]);
      assert.strictEqual(result.exitCode, 2);
      const output = result.stdout + result.stderr;
      assert.ok(output.includes("Unknown command"));
    });

    it("suggests help on error", async () => {
      const result = await runCLI(["unknown"]);
      assert.strictEqual(result.exitCode, 2);
      const output = result.stdout + result.stderr;
      assert.ok(output.includes("help"));
    });
  });
});
