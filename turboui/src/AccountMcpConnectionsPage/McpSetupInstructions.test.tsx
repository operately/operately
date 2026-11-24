import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { McpSetupInstructions } from "./McpSetupInstructions";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

const serverUrl = "https://work.example.com/mcp";
const writeText = jest.fn().mockResolvedValue(undefined);

function renderInstructions() {
  return render(
    <MemoryRouter>
      <McpSetupInstructions mcpServerUrl={serverUrl} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  writeText.mockClear();
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
});

test("starts with ChatGPT and copies the current instance URL", async () => {
  renderInstructions();

  expect(screen.getByRole("button", { name: "ChatGPT" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Copy server URL" }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(serverUrl));
  expect(screen.getByRole("link", { name: /Setup guides/ })).toHaveAttribute(
    "href",
    "https://operately.com/help/mcp-connections/",
  );
});

test("ends with prompts that can be copied into the selected client", async () => {
  renderInstructions();
  fireEvent.click(screen.getByRole("button", { name: "Cursor" }));

  expect(screen.getByRole("heading", { name: "Run your first prompt" })).toBeInTheDocument();
  expect(screen.getByText("Copy a prompt, paste it into Cursor, and run it.")).toBeInTheDocument();

  const prompts = [
    "Use Operately to show my overdue tasks and what’s due this week.",
    "Use Operately to summarize last week’s project progress and blockers.",
    "Use Operately to show which goals are off track, who owns them, and why.",
  ];
  prompts.forEach((prompt) => {
    const promptButton = screen.getByRole("button", { name: prompt });

    expect(promptButton).toHaveClass("!text-left");
    expect(promptButton).not.toHaveClass("w-full");
    expect(promptButton.querySelector("svg")).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: prompts[0] }));

  await waitFor(() => expect(writeText).toHaveBeenCalledWith(prompts[0]));
  expect(document.querySelector('[data-test-id="mcp-first-prompt-step"]')).toBeInTheDocument();
});

test.each([
  [
    "ChatGPT",
    "Install the plugin, start a new chat, type @, and select Operately. Then copy and run one of these prompts.",
  ],
  ["Claude", "Start a new chat, open + → Connectors, and enable Operately. Then copy and run one of these prompts."],
])("combines %s activation and first prompt into one final step", (client, description) => {
  renderInstructions();
  fireEvent.click(screen.getByRole("button", { name: client }));

  const steps = document.querySelectorAll('li[data-test-id$="-step"]');

  expect(screen.queryByRole("heading", { name: "Use it in a chat" })).not.toBeInTheDocument();
  expect(screen.getByText(description)).toBeInTheDocument();
  expect(steps).toHaveLength(4);
  expect(steps[3]).toHaveAttribute("data-test-id", "mcp-first-prompt-step");
});

test("switches to Codex CLI commands without leaving the page", async () => {
  renderInstructions();
  fireEvent.click(screen.getByRole("button", { name: "Codex CLI" }));

  expect(screen.getByRole("button", { name: "Codex CLI" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "ChatGPT" })).toHaveAttribute("aria-pressed", "false");
  expect(screen.queryByRole("button", { name: "Copy server URL" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Copy setup command" }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith(`codex mcp add operately --url ${serverUrl}`));
  fireEvent.click(screen.getByRole("button", { name: "Copy login command" }));
  await waitFor(() => expect(writeText).toHaveBeenCalledWith("codex mcp login operately"));
});

test("copies valid Cursor configuration with the current instance URL", async () => {
  renderInstructions();
  fireEvent.click(screen.getByRole("button", { name: "Cursor" }));
  fireEvent.click(screen.getByRole("button", { name: "Copy configuration" }));

  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
  expect(JSON.parse(writeText.mock.calls[0][0])).toEqual({ mcpServers: { operately: { url: serverUrl } } });
});

test("uses HTTP and user scope for Claude Code", async () => {
  renderInstructions();
  fireEvent.click(screen.getByRole("button", { name: "Claude Code" }));
  fireEvent.click(screen.getByRole("button", { name: "Copy setup command" }));

  await waitFor(() =>
    expect(writeText).toHaveBeenCalledWith(`claude mcp add --transport http --scope user operately ${serverUrl}`),
  );
  expect(screen.getByText("/mcp")).toBeInTheDocument();
});

test.each(["Claude", "Other"])("shows URL setup for %s", (client) => {
  renderInstructions();
  fireEvent.click(screen.getByRole("button", { name: client }));

  expect(screen.getByText(serverUrl)).toBeInTheDocument();
  expect(document.querySelector('[data-test-id="mcp-authorize-step"]')).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Copy setup command" })).not.toBeInTheDocument();
});

test("updates translated instructions and the help link when the language changes", async () => {
  renderInstructions();
  fireEvent.click(screen.getByRole("button", { name: "Other" }));

  await act(async () => {
    await i18n.changeLanguage("pt-BR");
  });

  expect(screen.getByRole("heading", { name: "Conectar um cliente" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Copiar URL do servidor" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Execute seu primeiro prompt" })).toBeInTheDocument();
  expect(screen.getByText("Copie um prompt, cole-o no seu cliente de IA e execute-o.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /Guias de configuração/ })).toHaveAttribute(
    "href",
    "https://operately.com/help/mcp-connections/",
  );
  expect(screen.getByText(serverUrl)).toBeInTheDocument();
});
