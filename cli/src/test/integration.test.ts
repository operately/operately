import { describe, it } from "node:test";
import * as assert from "node:assert";
import { spawn } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const { version: packageVersion } = require("../../package.json") as { version: string };

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

function writeAuthConfig(config: { activeProfile: string; profiles: Record<string, unknown> }): void {
  const configDir = path.join(testHome, ".operately");
  clearAuthConfig();
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(path.join(configDir, "config.json"), JSON.stringify(config, null, 2));
}

function clearAuthConfig(): void {
  fs.rmSync(path.join(testHome, ".operately"), { recursive: true, force: true });
}

describe("CLI Integration Tests", () => {
  describe("Command Routing", () => {
    it("shows general help when no command is provided", async () => {
      const result = await runCLI([]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Operately CLI"));
      assert.ok(result.stdout.includes("Usage:"));
      assert.ok(result.stdout.includes("Authentication & Setup:"));
      assert.ok(result.stdout.includes("auth create-company"));
      assert.ok(result.stdout.includes("auth join"));
    });

    it("shows version with --version flag", async () => {
      const result = await runCLI(["--version"]);
      assert.strictEqual(result.exitCode, 0);
      assert.strictEqual(result.stdout.trim(), packageVersion);
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
      const result = await runCLI(["projects", "get", "--help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Command: projects get"));
      assert.ok(result.stdout.includes("Input flags:"));
      assert.ok(result.stdout.includes("--id <id> (required)"));
      assert.ok(result.stdout.includes("--include-contributors <boolean> (optional, nullable)"));
      assert.ok(result.stdout.includes("Include flag behavior:"));
      assert.ok(result.stdout.includes("This does not mean the data does not exist; it simply was not preloaded."));
      assert.ok(result.stdout.includes("Included resources for this endpoint:"));
      assert.ok(result.stdout.includes("    - contributors"));
      assert.ok(result.stdout.includes("    - markdown"));
      assert.ok(!result.stdout.includes("Required flags:"));
      assert.ok(!result.stdout.includes("Optional flags:"));
      assert.ok(!result.stdout.includes("Include flags:"));
    });

    it("shows command help with trailing help", async () => {
      const result = await runCLI(["projects", "update_due_date", "help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Command: projects update_due_date"));
      assert.ok(result.stdout.includes("Input flags:"));
      assert.ok(!result.stdout.includes("Include flag behavior:"));
    });

    it("keeps include and non-include flags in the same input flag list", async () => {
      const result = await runCLI(["projects", "list", "--help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Command: projects list"));
      assert.ok(result.stdout.includes("Input flags:"));
      assert.ok(result.stdout.includes("--only-my-projects <boolean> (optional, nullable)"));
      assert.ok(result.stdout.includes("--include-milestones <boolean> (optional, nullable)"));
      assert.ok(!result.stdout.includes("Optional flags:"));
      assert.ok(!result.stdout.includes("Include flags:"));
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
      assert.ok(result.stdout.includes("Authentication & Setup"));
      assert.ok(result.stdout.includes("login"));
      assert.ok(result.stdout.includes("create-company"));
      assert.ok(result.stdout.includes("profiles"));
      assert.ok(result.stdout.includes("status"));
    });

    it("shows auth help when 'auth help' is used", async () => {
      const result = await runCLI(["auth", "help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Authentication & Setup"));
      assert.ok(result.stdout.includes("login"));
      assert.ok(result.stdout.includes("create-company"));
      assert.ok(result.stdout.includes("profiles"));
    });

    it("shows auth help when 'help auth' is used", async () => {
      const result = await runCLI(["help", "auth"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Authentication & Setup"));
      assert.ok(result.stdout.includes("login"));
      assert.ok(result.stdout.includes("create-company"));
      assert.ok(result.stdout.includes("profiles"));
      assert.ok(result.stdout.includes("status"));
    });

    it("shows auth create-company help with --help", async () => {
      const result = await runCLI(["auth", "create-company", "--help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Command:"));
      assert.ok(result.stdout.includes("auth create-company"));
      assert.ok(result.stdout.includes("operately auth create-company [--base-url <url>] [--profile <name>]"));
      assert.ok(result.stdout.includes("full-access CLI profile"));
    });

    it("shows auth login help with --help", async () => {
      const result = await runCLI(["auth", "login", "--help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Command:"));
      assert.ok(result.stdout.includes("auth login"));
      assert.ok(result.stdout.includes("operately auth login [--token <token>] [--base-url <url>] [--profile <name>]"));
      assert.ok(result.stdout.includes("interactively"));
    });

    it("shows auth profiles help with --help", async () => {
      const result = await runCLI(["auth", "profiles", "--help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Command:"));
      assert.ok(result.stdout.includes("auth profiles"));
      assert.ok(result.stdout.includes("operately auth profiles"));
      assert.ok(result.stdout.includes("List saved CLI profiles"));
    });

    it("shows auth whoami help with --help", async () => {
      const result = await runCLI(["auth", "whoami", "--help"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Command:"));
      assert.ok(result.stdout.includes("auth whoami"));
      assert.ok(result.stdout.includes("operately auth whoami [--profile <name>]"));
    });

    it("shows auth whoami help when 'help auth whoami' is used", async () => {
      const result = await runCLI(["help", "auth", "whoami"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("auth whoami"));
      assert.ok(result.stdout.includes("operately auth whoami [--profile <name>]"));
    });

    it("shows auth login help when 'help auth login' is used", async () => {
      const result = await runCLI(["help", "auth", "login"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("auth login"));
      assert.ok(result.stdout.includes("operately auth login [--token <token>] [--base-url <url>] [--profile <name>]"));
    });

    it("shows auth create-company help when 'help auth create-company' is used", async () => {
      const result = await runCLI(["help", "auth", "create-company"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("auth create-company"));
      assert.ok(result.stdout.includes("operately auth create-company [--base-url <url>] [--profile <name>]"));
    });

    it("shows auth profiles help when 'help auth profiles' is used", async () => {
      const result = await runCLI(["help", "auth", "profiles"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("auth profiles"));
      assert.ok(result.stdout.includes("operately auth profiles"));
    });

    it("shows auth help when 'auth' is used alone", async () => {
      const result = await runCLI(["auth"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Authentication & Setup"));
      assert.ok(result.stdout.includes("login"));
      assert.ok(result.stdout.includes("create-company"));
      assert.ok(result.stdout.includes("profiles"));
      assert.ok(result.stdout.includes("status"));
    });

    it("shows auth status with user-friendly format", async () => {
      const result = await runCLI(["auth", "status"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Profile:"));
      assert.ok(result.stdout.includes("Status:"));
      assert.ok(!result.stdout.includes("token_configured"));
    });

    it("shows saved CLI profiles from local config", async () => {
      try {
        writeAuthConfig({
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
          },
        });

        const result = await runCLI(["auth", "profiles"]);
        assert.strictEqual(result.exitCode, 0);
        assert.ok(result.stdout.includes("Saved CLI profiles:"));
        assert.ok(result.stdout.includes("* default (active)"));
        assert.ok(result.stdout.includes("- staging"));
        assert.ok(result.stdout.includes("Status: Logged in"));
        assert.ok(result.stdout.includes("Status: Not logged in"));
        assert.ok(result.stdout.includes("Name: Jane Admin"));
        assert.ok(result.stdout.includes("Company: Acme Corp"));
        assert.ok(result.stdout.includes("Base URL: https://app.operately.com"));
        assert.ok(result.stdout.includes("Base URL: https://staging.example.com"));
      } finally {
        clearAuthConfig();
      }
    });

    it("shows error for invalid auth command", async () => {
      const result = await runCLI(["auth", "invalid"]);
      assert.strictEqual(result.exitCode, 2);
      const output = result.stdout + result.stderr;
      assert.ok(output.includes("Invalid auth command"));
      assert.ok(output.includes("create-company"));
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
      assert.ok(result.stdout.includes("Allowed values for comment_parent_type:"));
      assert.ok(result.stdout.includes("project_check_in"));
      assert.ok(result.stdout.includes("goal_update"));
      assert.ok(result.stdout.includes("milestone"));
    });

    it("shows integer enum values in help", async () => {
      const result = await runCLI(["help", "projects", "create"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("--anonymous-access-level"));
      assert.ok(result.stdout.includes("Allowed values for access_options_int:"));
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

    it("shows markdown format for markdown fields", async () => {
      const result = await runCLI(["help", "projects", "update_description"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("<markdown>"));
      assert.ok(result.stdout.includes("--description-file <path>"));
      assert.ok(result.stdout.includes("Markdown Format:"));
      assert.ok(result.stdout.includes("Headings: # H1"));
      assert.ok(result.stdout.includes("Bold: **text**"));
      assert.ok(result.stdout.includes("Lists: - item"));
    });

    it("shows companion file flags for all markdown help entries", async () => {
      const projectResult = await runCLI(["help", "projects", "update_description"]);
      const spaceResult = await runCLI(["help", "spaces", "update_discussion"]);

      assert.strictEqual(projectResult.exitCode, 0);
      assert.strictEqual(spaceResult.exitCode, 0);
      assert.ok(projectResult.stdout.includes("--description-file <path>"));
      assert.ok(spaceResult.stdout.includes("--body-file <path>"));
      assert.ok(projectResult.stdout.includes("File input: use --<field>-file <path> to load markdown from a file"));
    });

    it("shows markdown help for all markdown fields", async () => {
      const result = await runCLI(["help", "comments", "create"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("--content"));
    });

    it("shows object type field definitions in help", async () => {
      const result = await runCLI(["help", "spaces", "add_members"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("--members <[add_member_input]>"));
      assert.ok(result.stdout.includes("Fields for object 'add_member_input':"));
      assert.ok(result.stdout.includes("id: <id>"));
      assert.ok(result.stdout.includes("access_level: <access_options_int>"));
    });

    it("shows enum values for fields within object types", async () => {
      const result = await runCLI(["help", "spaces", "add_members"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Fields for object 'add_member_input':"));
      assert.ok(result.stdout.includes("Allowed values for access_options_int:"));
      assert.ok(result.stdout.includes("0"));
      assert.ok(result.stdout.includes("1"));
      assert.ok(result.stdout.includes("10"));
      assert.ok(result.stdout.includes("100"));
    });

    it("shows field requirements for object types", async () => {
      const result = await runCLI(["help", "spaces", "add_members"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("id: <id> (required)"));
      assert.ok(result.stdout.includes("access_level: <access_options_int> (required)"));
    });

    it("excludes contextual_date from object type display when it has dedicated help", async () => {
      const result = await runCLI(["help", "tasks", "create"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Contextual Date Formats:"));
      assert.ok(!result.stdout.includes("Fields for object 'contextual_date':"));
    });

    it("shows contextual date help when contextual_date is within an object type", async () => {
      const result = await runCLI(["help", "goals", "create"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("--timeframe <timeframe>"));
      assert.ok(result.stdout.includes("Fields for object 'timeframe':"));
      assert.ok(result.stdout.includes("contextual_start_date: <contextual_date>"));
      assert.ok(result.stdout.includes("Contextual Date Formats:"));
      assert.ok(result.stdout.includes("YYYY-MM-DD"));
      assert.ok(result.stdout.includes("YYYY/q#"));
    });

    it("shows multiple object types when command has multiple custom types", async () => {
      const result = await runCLI(["help", "goals", "create"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("Fields for object 'timeframe':"));
      assert.ok(result.stdout.includes("Fields for object 'create_target_input':"));
    });

    it("does not duplicate enum values when same enum appears in multiple contexts", async () => {
      const result = await runCLI(["help", "projects", "create"]);
      assert.strictEqual(result.exitCode, 0);
      const matches = result.stdout.match(/Allowed values for access_options_int:/g);
      assert.strictEqual(matches?.length, 1, "Should only show enum values once");
    });

    it("shows object type help only for list item types", async () => {
      const result = await runCLI(["help", "spaces", "add_members"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("--members <[add_member_input]>"));
      assert.ok(result.stdout.includes("Fields for object 'add_member_input':"));
    });

    it("does not duplicate object type definitions when same type appears multiple times", async () => {
      const result = await runCLI(["help", "goals", "create"]);
      assert.strictEqual(result.exitCode, 0);
      const matches = result.stdout.match(/Fields for object 'timeframe':/g);
      assert.strictEqual(matches?.length, 1, "Should only show object type definition once");
    });
  });

  describe("Markdown Field Input", () => {
    it("accepts stored rich content for markdown fields", async () => {
      const result = await runCLI(["help", "projects", "update_description"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("<markdown>"));
    });

    it("accepts markdown input for markdown fields", async () => {
      const result = await runCLI(["help", "comments", "create"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("--content"));
      assert.ok(result.stdout.includes("<markdown>"));
      assert.ok(result.stdout.includes("Markdown Format:"));
    });

    it("shows markdown input hints for markdown fields", async () => {
      const result = await runCLI(["help", "projects", "update_description"]);
      assert.strictEqual(result.exitCode, 0);
      assert.ok(result.stdout.includes("--description"));
      assert.ok(result.stdout.includes("<markdown>"));
    });

    it("accepts file-backed markdown input for markdown fields", async () => {
      const dir = fs.mkdtempSync(path.join(os.tmpdir(), "operately-cli-markdown-file-"));
      const filePath = path.join(dir, "description.md");
      fs.writeFileSync(filePath, "# Roadmap\n\n- Launch dashboard", "utf8");

      try {
        const result = await runCLI([
          "projects",
          "update_description",
          "--project-id",
          "p1",
          "--description-file",
          filePath,
        ]);

        assert.strictEqual(result.exitCode, 3);
        assert.ok(result.stderr.includes("Missing API token"));
        assert.ok(!result.stderr.includes("Unknown input flag"));
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
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
