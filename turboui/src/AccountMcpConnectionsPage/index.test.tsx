import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { AccountMcpConnectionsPage } from "./index";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";

function getByTestId(testId: string): HTMLElement {
  const element = document.querySelector(`[data-test-id="${testId}"]`);

  if (!element) {
    throw new Error(`Unable to find element with data-test-id="${testId}"`);
  }

  return element as HTMLElement;
}

function renderPage(props: Partial<AccountMcpConnectionsPage.Props> = {}) {
  return render(
    <MemoryRouter>
      <AccountMcpConnectionsPage
        grants={[]}
        pendingRevokeIds={{}}
        onRevokeGrant={jest.fn()}
        homePath="#"
        securityPath="#"
        mcpServerUrl="https://app.operately.com/mcp"
        formattedTimePreferences={defaultFormattedTimePreferences}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("AccountMcpConnectionsPage", () => {
  it("shows the server URL once, referenced by the connect instructions", () => {
    renderPage();

    expect(screen.getByText("https://app.operately.com/mcp")).toBeInTheDocument();
  });

  it("defaults to the first client's instructions", () => {
    renderPage();

    expect(screen.getByText(/In ChatGPT, go to Settings/)).toBeInTheDocument();
  });

  it("switches instructions when a different client tab is selected", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByText("Cursor"));

    expect(screen.getByText(/Open Cursor Settings/)).toBeInTheDocument();
    expect(screen.queryByText(/In ChatGPT, go to Settings/)).not.toBeInTheDocument();
  });

  it("links to the docs for other clients and troubleshooting", () => {
    renderPage();

    const link = getByTestId("mcp-setup-guides-link");
    expect(link).toHaveAttribute("href", "https://operately.com/help/mcp-connections/");
  });
});
