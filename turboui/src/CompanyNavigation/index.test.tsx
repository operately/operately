import "@testing-library/jest-dom";
import { fireEvent, render, waitFor } from "@testing-library/react";
import { createInstance } from "i18next";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";

import { CompanyNavigation } from "./index";
import { defaultProps } from "./mockData";

function renderNav(overrides: Partial<CompanyNavigation.Props> = {}) {
  return render(
    <MemoryRouter>
      <CompanyNavigation {...defaultProps} {...overrides} />
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

describe("CompanyNavigation", () => {
  it("shows review and notification counts", () => {
    renderNav();

    expect(getByTestId("review-link-count")).toHaveTextContent("2");
    expect(getByTestId("unread-notifications-count")).toHaveTextContent("3");
  });

  it("hides counts when they are zero", () => {
    renderNav({ unreadNotificationCount: 0, reviewCount: 0 });

    expect(document.querySelector(`[data-test-id="review-link-count"]`)).not.toBeInTheDocument();
    expect(document.querySelector(`[data-test-id="unread-notifications-count"]`)).not.toBeInTheDocument();
  });

  it("hides gated new-dropdown items when permissions are off", () => {
    renderNav({
      canAddGoal: false,
      canAddProject: false,
      canAddSpace: false,
      canInvitePeople: false,
    });

    expect(document.querySelector(`[data-test-id="new-dropdown"]`)).not.toBeInTheDocument();
  });

  it("calls onLogOut from the account menu", async () => {
    const onLogOut = jest.fn();
    renderNav({ onLogOut });

    fireEvent.pointerDown(getByTestId("account-menu"));
    fireEvent.keyDown(getByTestId("account-menu"), { key: "Enter" });

    await waitFor(() => {
      expect(getByTestId("log-out-button")).toBeInTheDocument();
    });

    fireEvent.click(getByTestId("log-out-button"));

    expect(onLogOut).toHaveBeenCalled();
  });

  it("truncates long company names in the dropdown trigger", () => {
    renderNav({ companyName: "Nexus Global Manufacturing Group" });

    const trigger = getByTestId("company-dropdown");

    expect(trigger).toHaveTextContent("Nexus Global Manufactur…");
    expect(trigger).toHaveAttribute("title", "Nexus Global Manufacturing Group");
  });

  it("does not show the update badge when it is disabled", () => {
    renderNav({ availableUpdate: { version: "v1.8" } });

    expect(document.querySelector(`[data-test-id="update-available-badge"]`)).not.toBeInTheDocument();
  });

  it("hides the update badge when enabled but no update is available", () => {
    renderNav({ showCurrentVersion: true });

    expect(document.querySelector(`[data-test-id="update-available-badge"]`)).not.toBeInTheDocument();
  });

  it("clearly identifies the available update and its version", () => {
    renderNav({ showCurrentVersion: true, availableUpdate: { version: "v1.8" } });

    const badge = getByTestId("update-available-badge");

    expect(badge).toHaveTextContent("v1.8 available");
    expect(badge).toHaveAttribute(
      "title",
      "Operately v1.8 is available. This instance is running an older version. View release notes.",
    );
  });

  it.each([
    {
      label: "English",
      resources: {},
      newLabel: "New",
      help: "Help",
      badgeTitle: "Operately v1.8 is available. This instance is running an older version. View release notes.",
      badgeText: "v1.8 available",
    },
    {
      label: "substituted",
      resources: {
        New: "Novo",
        Help: "Ajuda",
        "Operately {{version}} is available. This instance is running an older version. View release notes.":
          "Operately {{version}} está disponível. Esta instância está em uma versão anterior. Ver notas de lançamento.",
        "<version>{{version}}</version> available": "<version>{{version}}</version> disponível",
      },
      newLabel: "Novo",
      help: "Ajuda",
      badgeTitle: "Operately v1.8 está disponível. Esta instância está em uma versão anterior. Ver notas de lançamento.",
      badgeText: "v1.8 disponível",
    },
  ])("uses catalog copy for navigation chrome: $label", async ({ resources, newLabel, help, badgeTitle, badgeText }) => {
    const i18n = createInstance();
    await i18n.init({ lng: "en", resources: { en: { translation: resources } } });

    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <CompanyNavigation {...defaultProps} showCurrentVersion availableUpdate={{ version: "v1.8" }} />
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(getByTestId("new-dropdown")).toHaveTextContent(newLabel);
    expect(getByTestId("help-dropdown")).toHaveTextContent(help);

    const badge = getByTestId("update-available-badge");
    expect(badge).toHaveTextContent(badgeText);
    expect(badge).toHaveAttribute("title", badgeTitle);
  });
});
