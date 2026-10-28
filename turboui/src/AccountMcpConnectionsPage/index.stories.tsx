import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { expect, userEvent, within } from "storybook/test";
import { AccountMcpConnectionsPage } from "./index";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";

const meta = {
  title: "Pages/AccountMcpConnectionsPage",
  component: AccountMcpConnectionsPage,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AccountMcpConnectionsPage>;

export default meta;
type Story = StoryObj<typeof meta>;

const now = new Date().toISOString();

const initialGrants: AccountMcpConnectionsPage.Grant[] = [
  {
    id: "grant_abc123",
    clientId: "https://client.example.com/oauth/client.json",
    clientName: "Example MCP Client",
    scopes: ["mcp:read"],
    insertedAt: now,
    lastUsedAt: now,
  },
  {
    id: "grant_def456",
    clientId: "https://chatgpt.example.com/client.json",
    clientName: "ChatGPT",
    scopes: ["mcp:read", "mcp:write"],
    insertedAt: now,
    lastUsedAt: null,
  },
];

function InteractiveStory() {
  const [grants, setGrants] = React.useState(initialGrants);
  const [pendingRevokeIds, setPendingRevokeIds] = React.useState<Record<string, boolean>>({});

  const onRevokeGrant = React.useCallback((grantId: string) => {
    setPendingRevokeIds((prev) => ({ ...prev, [grantId]: true }));
    setGrants((prev) => prev.filter((grant) => grant.id !== grantId));

    window.setTimeout(() => {
      setPendingRevokeIds((prev) => {
        const next = { ...prev };
        delete next[grantId];
        return next;
      });
    }, 300);
  }, []);

  return (
    <AccountMcpConnectionsPage
      grants={grants}
      pendingRevokeIds={pendingRevokeIds}
      onRevokeGrant={onRevokeGrant}
      homePath="#"
      securityPath="#"
      mcpServerUrl="https://app.operately.com/mcp"
      formattedTimePreferences={defaultFormattedTimePreferences}
    />
  );
}

export const Default: Story = {
  args: {
    grants: initialGrants,
    pendingRevokeIds: {},
    onRevokeGrant: () => {},
    homePath: "#",
    securityPath: "#",
    mcpServerUrl: "https://app.operately.com/mcp",
    formattedTimePreferences: defaultFormattedTimePreferences,
  },
  render: () => <InteractiveStory />,
};

export const EmptyState: Story = {
  args: {
    grants: [],
    pendingRevokeIds: {},
    onRevokeGrant: () => {},
    homePath: "#",
    securityPath: "#",
    mcpServerUrl: "https://app.operately.com/mcp",
    formattedTimePreferences: defaultFormattedTimePreferences,
  },
};

export const ClientSetup: Story = {
  ...EmptyState,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const client of ["Claude", "Cursor", "Codex CLI", "Claude Code", "Other", "ChatGPT"]) {
      const button = canvas.getByRole("button", { name: client });
      await userEvent.click(button);
      await expect(button).toHaveAttribute("aria-pressed", "true");
      await expect(canvasElement.querySelector('[data-test-id="mcp-authorize-step"]')).toBeVisible();
    }
  },
};

export const SelfHosted: Story = {
  ...EmptyState,
  args: { ...EmptyState.args, mcpServerUrl: "https://work.example.com/mcp" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Codex CLI" }));
    await expect(canvas.getByText("codex mcp add operately --url https://work.example.com/mcp")).toBeVisible();
  },
};
