import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";

import i18n from "../i18n";
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

it.each([
  ["Or, visit the <actionLink>Admin Panel</actionLink>.", "Admin Panel"],
  ["Ou visite o <actionLink>Painel administrativo</actionLink>.", "Painel administrativo"],
])("preserves the admin link in catalog copy: %s", async (message, label) => {
  const i18n = createInstance();
  await i18n.init({
    lng: "en",
    resources: { en: { translation: { "Or, visit the <actionLink>Admin Panel</actionLink>.": message } } },
  });
  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <LobbyPage firstName="Ada" companies={[]} newCompanyPath="/new" adminPath="/admin" />
      </MemoryRouter>
    </I18nextProvider>,
  );
  expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", "/admin");
});

it.each([
  ["Welcome to Operately, {{name}}!", "+ Create organization"],
  ["Translated welcome, {{name}}!", "Translated create organization"],
])("uses catalog copy for lobby chrome: %s", async (welcome, create) => {
  const i18n = createInstance();
  await i18n.init({
    lng: "en",
    resources: {
      en: {
        translation: {
          "Welcome to Operately, {{name}}!": welcome,
          "+ Create organization": create,
        },
      },
    },
  });

  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <LobbyPage firstName="Ada" companies={[]} newCompanyPath="/new" />
      </MemoryRouter>
    </I18nextProvider>,
  );

  expect(screen.getByText(welcome.replace("{{name}}", "Ada"))).toBeInTheDocument();
  expect(getByTestId("add-company-card")).toHaveTextContent(create);
});

it("uses Portuguese catalog copy when present, including plurals", async () => {
  i18n.addResourceBundle(
    "pt-BR",
    "translation",
    {
      "Welcome to Operately, {{name}}!": "Boas-vindas ao Operately, {{name}}!",
      "1 member_one": "1 membro",
      "1 member_other": "{{count}} membros",
      "1 member_many": "{{count}} membros",
      "1 member_zero": "{{count}} membros",
      "+ Create organization": "+ Criar empresa",
    },
    true,
    true,
  );
  await i18n.changeLanguage("pt-BR");

  const view = render(
    <MemoryRouter>
      <LobbyPage
        firstName="Ada"
        companies={[{ id: "1", name: "Acme", memberCount: 3, link: "/acme" }]}
        newCompanyPath="/new"
      />
    </MemoryRouter>,
  );

  try {
    expect(screen.getByText("Boas-vindas ao Operately, Ada!")).toBeInTheDocument();
    expect(screen.getByText("3 membros")).toBeInTheDocument();
    expect(getByTestId("add-company-card")).toHaveTextContent("+ Criar empresa");
  } finally {
    view.unmount();
    await i18n.changeLanguage("en");
    i18n.removeResourceBundle("pt-BR", "translation");
  }
});
