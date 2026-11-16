import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createInstance } from "i18next";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter, useLocation } from "react-router";

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

function CurrentRoute() {
  return <output data-test-id="current-route">{useLocation().pathname}</output>;
}

describe("mobile CompanyNavigation", () => {
  const originalWidth = window.innerWidth;

  beforeEach(() => {
    window.innerWidth = 374;
  });

  afterEach(() => {
    window.innerWidth = originalWidth;
  });

  it("exposes a named native button and toggles the disclosure with pointer interaction", async () => {
    const user = userEvent.setup();
    renderNav();

    const trigger = screen.getByRole("button", { name: "Navigation menu" });
    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "My work" })).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "My work" })).toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "My work" })).not.toBeInTheDocument();
  });

  it.each(["{Enter}", " "])("opens and closes using the keyboard with %s", async (key) => {
    const user = userEvent.setup();
    renderNav();

    const trigger = screen.getByRole("button", { name: "Navigation menu" });
    await user.tab({ shift: true });
    expect(trigger).toHaveFocus();
    await user.keyboard(key);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "My work" })).toBeInTheDocument();
    expect(trigger).toHaveFocus();
    await user.keyboard(key);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "My work" })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on link selection and navigates to the supplied destination", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CompanyNavigation {...defaultProps} />
        <CurrentRoute />
      </MemoryRouter>,
    );

    const trigger = screen.getByRole("button", { name: "Navigation menu" });
    await user.click(trigger);
    const link = screen.getByRole("link", { name: "My work" });
    expect(link).toHaveAttribute("href", defaultProps.links.profile);
    await user.click(link);
    expect(getByTestId("current-route")).toHaveTextContent(defaultProps.links.profile);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(link).not.toBeInTheDocument();
  });

  it("preserves the logout callback and dismisses the panel", async () => {
    const user = userEvent.setup();
    const onLogOut = jest.fn();
    renderNav({ onLogOut });
    const trigger = screen.getByRole("button", { name: "Navigation menu" });
    await user.click(trigger);
    await user.click(screen.getByText("Log Out"));
    expect(onLogOut).toHaveBeenCalledTimes(1);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("uses the current translation for its accessible name", async () => {
    const i18n = createInstance();
    await i18n.init({
      lng: "pt-BR",
      resources: { "pt-BR": { translation: { "Navigation menu": "Menu de navegação" } } },
    });
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <CompanyNavigation {...defaultProps} />
        </MemoryRouter>
      </I18nextProvider>,
    );
    expect(screen.getByRole("button", { name: "Menu de navegação" })).toHaveAttribute("aria-expanded", "false");
  });
});

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

  it.each(["{Enter}", " "])("operates the Account menu with the keyboard using %s", async (key) => {
    const user = userEvent.setup();
    renderNav();

    const trigger = screen.getByRole("button", { name: "Account" });
    await user.tab({ shift: true });
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.keyboard(key);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(getByTestId("profile-link")).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(getByTestId("settings-link")).toHaveFocus();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("calls onLogOut from the account menu with pointer interaction", async () => {
    const user = userEvent.setup();
    const onLogOut = jest.fn();
    renderNav({ onLogOut });

    await user.click(screen.getByRole("button", { name: "Account" }));

    await waitFor(() => {
      expect(getByTestId("log-out-button")).toBeInTheDocument();
    });

    await user.click(getByTestId("log-out-button"));

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
      account: "Account",
      badgeTitle: "Operately v1.8 is available. This instance is running an older version. View release notes.",
      badgeText: "v1.8 available",
    },
    {
      label: "substituted",
      resources: {
        New: "Novo",
        Help: "Ajuda",
        Account: "Conta",
        "Operately {{version}} is available. This instance is running an older version. View release notes.":
          "Operately {{version}} está disponível. Esta instância está em uma versão anterior. Ver notas de lançamento.",
        "<version>{{version}}</version> available": "<version>{{version}}</version> disponível",
      },
      newLabel: "Novo",
      help: "Ajuda",
      account: "Conta",
      badgeTitle:
        "Operately v1.8 está disponível. Esta instância está em uma versão anterior. Ver notas de lançamento.",
      badgeText: "v1.8 disponível",
    },
  ])(
    "uses catalog copy for navigation chrome: $label",
    async ({ resources, newLabel, help, account, badgeTitle, badgeText }) => {
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
      expect(screen.getByRole("button", { name: account })).toHaveAccessibleName(account);

      const badge = getByTestId("update-available-badge");
      expect(badge).toHaveTextContent(badgeText);
      expect(badge).toHaveAttribute("title", badgeTitle);
    },
  );
});
