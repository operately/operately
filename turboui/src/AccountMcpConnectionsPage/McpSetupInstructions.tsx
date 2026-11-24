import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { OpenAI, Claude, Cursor, Codex, ClaudeCode } from "../BrandIcons";
import { CopyToClipboard } from "../CopyToClipboard";
import { IconDots, IconExternalLink } from "../icons";
import { DivLink } from "../Link";
import { Trans } from "../Translate";
import { ViewToggle } from "../ViewToggle";

type Client = "chatgpt" | "claude" | "cursor" | "codex" | "claude-code" | "other";

interface StarterPrompt {
  text: string;
  testId: string;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  snippet?: { text: string; copyLabel: string; testId: string };
  prompts?: StarterPrompt[];
  link?: { url: string; label: string };
}

export function McpSetupInstructions({ mcpServerUrl }: { mcpServerUrl: string }) {
  const { t } = useTranslation();
  const [client, setClient] = React.useState<Client>("chatgpt");
  const clients: { value: Client; label: string; icon: React.ReactNode }[] = [
    { value: "chatgpt", label: "ChatGPT", icon: <OpenAI /> },
    { value: "claude", label: "Claude", icon: <Claude /> },
    { value: "cursor", label: "Cursor", icon: <Cursor /> },
    { value: "codex", label: "Codex CLI", icon: <Codex /> },
    { value: "claude-code", label: "Claude Code", icon: <ClaudeCode /> },
    { value: "other", label: t("Other"), icon: <IconDots size={20} aria-hidden="true" /> },
  ];

  return (
    <section className="mt-8" aria-labelledby="mcp-setup-heading" data-test-id="mcp-setup-section">
      <h2 id="mcp-setup-heading" className="font-bold">
        {t("Connect a client")}
      </h2>

      <ViewToggle<Client>
        value={client}
        ariaLabel={t("AI client")}
        className="mt-4 !grid w-full grid-cols-3 sm:grid-cols-6 [&>button]:h-16 [&>button]:flex-col [&>button]:justify-center [&>button]:gap-2 [&>button]:px-1 [&>button>span:first-child]:size-5"
        options={clients.map((option) => ({ ...option, onSelect: setClient, testId: `mcp-client-${option.value}` }))}
      />

      <ol key={client} className="mt-6 space-y-5" data-test-id={`mcp-instructions-${client}`}>
        {setupSteps(client, mcpServerUrl, t).map((step, index) => (
          <li key={step.id} className="flex gap-3" data-test-id={`mcp-${step.id}-step`}>
            <span
              aria-hidden="true"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-dimmed text-xs font-semibold text-content-dimmed"
            >
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold leading-6">{step.title}</h3>
              <p className="text-sm text-content-dimmed mt-0.5">{step.description}</p>
              {step.link && (
                <SetupLink to={step.link.url} className="mt-2 text-sm">
                  {step.link.label}
                </SetupLink>
              )}
              {step.snippet && <CopyableSnippet {...step.snippet} />}
              {step.prompts && <PromptList prompts={step.prompts} />}
            </div>
          </li>
        ))}
      </ol>

      <p className="text-sm text-content-dimmed mt-6">
        <Trans
          i18nKey="Need help? <guides>Setup guides</guides>"
          components={{
            guides: <SetupLink to="https://operately.com/help/mcp-connections/" testId="mcp-setup-guides-link" />,
          }}
        />
      </p>
    </section>
  );
}

function setupSteps(client: Client, serverUrl: string, t: TFunction): SetupStep[] {
  return [
    ...clientSetupSteps(client, serverUrl, t),
    {
      id: "first-prompt",
      title: t("Run your first prompt"),
      description: firstPromptDescription(client, t),
      prompts: starterPrompts(t),
    },
  ];
}

function firstPromptDescription(client: Client, t: TFunction): string {
  switch (client) {
    case "chatgpt":
      return t(
        "Install the plugin, start a new chat, type @, and select Operately. Then copy and run one of these prompts.",
      );
    case "claude":
      return t("Start a new chat, open + → Connectors, and enable Operately. Then copy and run one of these prompts.");
    default:
      return t("Copy a prompt, paste it into {{client}}, and run it.", { client: clientLabel(client, t) });
  }
}

function clientSetupSteps(client: Client, serverUrl: string, t: TFunction): SetupStep[] {
  const serverSnippet = { text: serverUrl, copyLabel: t("Copy server URL"), testId: "mcp-server-url" };
  const authorize: SetupStep = {
    id: "authorize",
    title: t("Authorize access"),
    description: t(
      "Sign in to Operately, choose your company if prompted, and review the permissions before authorizing.",
    ),
  };

  switch (client) {
    case "chatgpt":
      return [
        {
          id: "open",
          title: t("Open ChatGPT plugins"),
          description: t("Select +, then Add custom MCP server."),
          link: { url: "https://chatgpt.com/plugins", label: t("Open ChatGPT") },
        },
        {
          id: "server",
          title: t("Add Operately"),
          description: t(
            "Name it Operately, paste this server URL, and choose OAuth. Review the prompt, then select Create as a plugin.",
          ),
          snippet: serverSnippet,
        },
        authorize,
      ];
    case "claude":
      return [
        {
          id: "open",
          title: t("Open Claude connectors"),
          description: t("Go to Customize → Connectors. Select + Add, then Add custom connector."),
          link: { url: "https://claude.ai/customize/connectors", label: t("Open Claude") },
        },
        {
          id: "server",
          title: t("Add Operately"),
          description: t(
            "Name it Operately and paste this server URL. Continue with the detected OAuth settings and choose Sign in now.",
          ),
          snippet: serverSnippet,
        },
        authorize,
      ];
    case "cursor":
      return [
        {
          id: "server",
          title: t("Add the server configuration"),
          description: t("Open ~/.cursor/mcp.json and add Operately to mcpServers. Keep any servers already listed."),
          snippet: {
            text: JSON.stringify({ mcpServers: { operately: { url: serverUrl } } }, null, 2),
            copyLabel: t("Copy configuration"),
            testId: "mcp-cursor-config",
          },
        },
        {
          id: "login",
          title: t("Connect in Cursor"),
          description: t("Open Cursor’s MCP settings, find Operately, and select Connect to sign in."),
        },
        authorize,
      ];
    case "codex":
      return [
        {
          id: "server",
          title: t("Add the MCP server"),
          description: t("Run this command in your terminal."),
          snippet: {
            text: `codex mcp add operately --url ${serverUrl}`,
            copyLabel: t("Copy setup command"),
            testId: "mcp-setup-command",
          },
        },
        {
          id: "login",
          title: t("Sign in with Codex"),
          description: t("Run this command to open the authorization page in your browser."),
          snippet: {
            text: "codex mcp login operately",
            copyLabel: t("Copy login command"),
            testId: "mcp-login-command",
          },
        },
        authorize,
      ];
    case "claude-code":
      return [
        {
          id: "server",
          title: t("Add the MCP server"),
          description: t("Run this command in your terminal."),
          snippet: {
            text: `claude mcp add --transport http --scope user operately ${serverUrl}`,
            copyLabel: t("Copy setup command"),
            testId: "mcp-setup-command",
          },
        },
        {
          id: "login",
          title: t("Connect in Claude Code"),
          description: t("Start Claude Code, run /mcp, and select Operately to authenticate."),
          snippet: { text: "/mcp", copyLabel: t("Copy login command"), testId: "mcp-login-command" },
        },
        authorize,
      ];
    case "other":
      return [
        {
          id: "open",
          title: t("Open your client’s MCP settings"),
          description: t("Add a remote MCP server with Streamable HTTP and OAuth support."),
        },
        {
          id: "server",
          title: t("Add Operately"),
          description: t("Name the server Operately and paste this URL."),
          snippet: serverSnippet,
        },
        authorize,
      ];
  }
}

function clientLabel(client: Client, t: TFunction): string {
  switch (client) {
    case "chatgpt":
      return "ChatGPT";
    case "claude":
      return "Claude";
    case "cursor":
      return "Cursor";
    case "codex":
      return "Codex CLI";
    case "claude-code":
      return "Claude Code";
    case "other":
      return t("your AI client");
  }
}

function starterPrompts(t: TFunction): StarterPrompt[] {
  return [
    {
      text: t("Use Operately to show my overdue tasks and what’s due this week."),
      testId: "mcp-prompt-overdue-tasks",
    },
    {
      text: t("Use Operately to summarize last week’s project progress and blockers."),
      testId: "mcp-prompt-project-progress",
    },
    {
      text: t("Use Operately to show which goals are off track, who owns them, and why."),
      testId: "mcp-prompt-off-track-goals",
    },
  ];
}

function CopyableSnippet({ text, copyLabel, testId }: NonNullable<SetupStep["snippet"]>) {
  return (
    <div className="mt-3 flex items-start gap-3 rounded-md border border-stroke-base bg-surface-dimmed px-3 py-2.5">
      <pre className="min-w-0 flex-1 whitespace-pre-wrap break-words font-mono text-sm leading-6 select-all">
        <code data-test-id={testId}>{text}</code>
      </pre>
      <CopyToClipboard
        text={text}
        size={18}
        padding={2}
        ariaLabel={copyLabel}
        className="shrink-0"
        testId={`copy-${testId}`}
      />
    </div>
  );
}

function PromptList({ prompts }: { prompts: StarterPrompt[] }) {
  return (
    <div className="mt-3 space-y-2">
      {prompts.map((prompt) => (
        <CopyToClipboard
          key={prompt.testId}
          text={prompt.text}
          label={prompt.text}
          ariaLabel={prompt.text}
          size={16}
          showIcon
          className="block min-h-10 w-fit max-w-full whitespace-normal !px-3 !py-2.5 !text-left font-normal leading-5"
          testId={prompt.testId}
        />
      ))}
    </div>
  );
}

function SetupLink({
  to,
  children,
  className = "",
  testId,
}: {
  to: string;
  children?: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <DivLink
      to={to}
      external
      target="_blank"
      className={`text-link-base hover:text-link-hover inline-flex items-center gap-1 ${className}`}
      testId={testId}
    >
      {children}
      <IconExternalLink size={14} aria-hidden="true" />
    </DivLink>
  );
}
