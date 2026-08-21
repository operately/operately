import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";

import { HomePage } from "./index";
import { defaultProps } from "./mockData";

function renderPage(overrides: Partial<HomePage.Props> = {}) {
  return render(
    <MemoryRouter>
      <HomePage {...defaultProps} {...overrides} />
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

describe("HomePage", () => {
  it("greets by time of day and first name", () => {
    renderPage({ now: new Date("2026-08-21T10:00:00") });

    expect(screen.getByText("Good morning, John!")).toBeInTheDocument();
  });

  it("uses an afternoon greeting after noon", () => {
    renderPage({ now: new Date("2026-08-21T14:00:00") });

    expect(screen.getByText("Good afternoon, John!")).toBeInTheDocument();
  });

  it("uses an evening greeting after 18:00", () => {
    renderPage({ now: new Date("2026-08-21T20:00:00") });

    expect(screen.getByText("Good evening, John!")).toBeInTheDocument();
  });

  it("shows the spaces zero state when there are no spaces", () => {
    renderPage({ spaces: [] });

    expect(getByTestId("spaces-zero-state")).toBeInTheDocument();
  });

  it("hides space and invite actions without permissions", () => {
    renderPage({ canCreateSpace: false, canInviteMembers: false });

    expect(document.querySelector(`[data-test-id="add-space"]`)).not.toBeInTheDocument();
    expect(document.querySelector(`[data-test-id="invite-people"]`)).not.toBeInTheDocument();
  });

  it("renders the activity feed slot", () => {
    renderPage();

    expect(screen.getByText("Activity feed")).toBeInTheDocument();
  });
});
