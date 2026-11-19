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
  expect(screen.getByRole("link", { name: /Guias de configuração/ })).toHaveAttribute(
    "href",
    "https://operately.com/help/mcp-connections/",
  );
  expect(screen.getByText(serverUrl)).toBeInTheDocument();
});
