import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";

import { HomePage } from "./index";
import { defaultProps } from "./mockData";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

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

test("looks up complete greetings and empty-state copy without interpreting names", () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "Good morning, {{name}}!": "{{name}} — translated greeting",
      "No spaces yet": "Translated empty state",
      "Your Operately Spaces": "Translated spaces",
    },
    true,
    true,
  );
  renderPage({ firstName: "Ana <strong> & Co", spaces: [] });
  expect(screen.getByText("Ana <strong> & Co — translated greeting")).toBeInTheDocument();
  expect(screen.getByText("Translated empty state")).toBeInTheDocument();
  expect(screen.getByText("Translated spaces")).toBeInTheDocument();
  expect(document.querySelector("strong")).toBeNull();
});

test.each([
  [10, "Bom dia, John!"],
  [14, "Boa tarde, John!"],
  [20, "Boa noite, John!"],
])("Portuguese greeting at %i uses a complete sentence", async (hour, greeting) => {
  await i18n.changeLanguage("pt-BR");
  renderPage({ now: new Date(2026, 7, 21, hour), spaces: [] });
  expect(screen.getByText(greeting)).toBeInTheDocument();
  expect(screen.getByText("Nenhum espaço ainda")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Adicionar espaço" })).toHaveAttribute("href", defaultProps.newSpacePath);
  expect(screen.getByRole("link", { name: "Convidar pessoas" })).toHaveAttribute("href", defaultProps.invitePeoplePath);
});
test("missing Portuguese messages fall back to English", async () => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  renderPage({ spaces: [] });
  expect(screen.getByText("Good morning, John!")).toBeInTheDocument();
  expect(screen.getByText("No spaces yet")).toBeInTheDocument();
});
