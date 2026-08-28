import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";

import { LobbyPage } from "./index";
import { defaultProps } from "./mockData";

function renderPage(overrides: Partial<LobbyPage.Props> = {}) {
  return render(
    <MemoryRouter>
      <LobbyPage {...defaultProps} {...overrides} />
    </MemoryRouter>,
  );
}

function getByTestId(testId: string): HTMLElement {
  const element = document.querySelector(`[data-test-id="${testId}"]`);

  if (!element) {
    throw new Error(`Unable to find element with data-test-id="${testId}"`);
  }

  return element as HTMLElement;
}

describe("LobbyPage", () => {
  it("renders the create-organization card", () => {
    renderPage();

    expect(getByTestId("add-company-card")).toBeInTheDocument();
  });

  it("hides the admin link when adminPath is missing", () => {
    renderPage();

    expect(document.querySelector('a[href="/admin"]')).not.toBeInTheDocument();
  });

  it("shows the admin link when adminPath is set", () => {
    renderPage({ adminPath: "/admin" });

    const link = document.querySelector('a[href="/admin"]');

    expect(link).toBeInTheDocument();
    expect(link).toHaveTextContent("Admin Panel");
  });

  it("shows the current version when releaseVersion is available", () => {
    renderPage();

    expect(getByTestId("current-version")).toHaveTextContent("v1.8");
  });

  it("hides the version when it is missing", () => {
    renderPage({ version: null });

    expect(document.querySelector('[data-test-id="current-version"]')).not.toBeInTheDocument();
  });
});
