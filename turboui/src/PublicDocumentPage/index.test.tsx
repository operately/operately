import React from "react";
import { render, screen } from "@testing-library/react";
import { PublicDocumentPage } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();
import { defaultFormattedTimePreferences } from "../FormattedTime";

jest.mock("../RichContent", () => ({ __esModule: true, default: () => <div data-testid="document-content" /> }));

it("renders the document without private workspace controls", () => {
  render(
    <PublicDocumentPage
      formattedTimePreferences={defaultFormattedTimePreferences}
      document={{
        __typename: "public_document",
        name: "Briefing",
        content: "{}",
        publishedAt: "2026-09-21T12:00:00Z",
        updatedAt: "2026-09-21T12:00:00Z",
      }}
    />,
  );
  expect(screen.getByTestId("document-content")).toBeTruthy();
  expect(screen.queryAllByRole("button")).toHaveLength(0);
  const attribution = screen.getByRole("link", { name: "Shared with Operately" });
  expect(attribution.getAttribute("href")).toBe("https://operately.com");
  expect(attribution.closest('[data-test-id="public-document-page"]')).toBeNull();
  expect(screen.queryAllByRole("link")).toHaveLength(1);
  expect(document.querySelector('[data-test-id="navigation"]')).toBeNull();
});

it("replaces the document with an unavailable state when access is lost", () => {
  const props = { formattedTimePreferences: defaultFormattedTimePreferences };
  const { rerender } = render(
    <PublicDocumentPage
      {...props}
      document={{
        __typename: "public_document",
        name: "Briefing",
        content: "{}",
        publishedAt: "2026-09-21T12:00:00Z",
        updatedAt: "2026-09-21T12:00:00Z",
      }}
    />,
  );
  rerender(<PublicDocumentPage {...props} />);
  expect(screen.queryByTestId("document-content")).toBeNull();
  expect(document.querySelector('[data-test-id="public-document-unavailable"]')).toBeTruthy();
});

it("looks up loading and unavailable copy", () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "Loading document": "Translated loading title",
      "Loading document…": "Translated loading",
      "Document unavailable": "Translated unavailable",
      "This link may have been disabled or the document removed.": "Translated explanation",
    },
    true,
    true,
  );

  const props = { formattedTimePreferences: defaultFormattedTimePreferences };
  const { rerender } = render(<PublicDocumentPage {...props} loading />);

  expect(screen.getByRole("heading").textContent).toBe("Translated loading");
  expect(document.title).toContain("Translated loading title");

  rerender(<PublicDocumentPage {...props} />);

  expect(screen.getByRole("heading").textContent).toBe("Translated unavailable");
  expect(screen.getByText("Translated explanation")).toBeTruthy();
});

it.each(["pt-BR", "missing"])("public copy and fallback preserve content: %s", async (language) => {
  if (language === "missing") i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  const portuguese = language === "pt-BR";
  const props = { formattedTimePreferences: defaultFormattedTimePreferences };
  const view = render(<PublicDocumentPage {...props} loading />);

  expect(screen.getByRole("heading").textContent).toBe(portuguese ? "Carregando documento…" : "Loading document…");

  view.rerender(<PublicDocumentPage {...props} />);

  expect(screen.getByRole("heading").textContent).toBe(portuguese ? "Documento indisponível" : "Document unavailable");
  expect(
    screen.getByText(
      portuguese
        ? "Este link pode ter sido desativado ou o documento removido."
        : "This link may have been disabled or the document removed.",
    ),
  ).toBeTruthy();

  view.rerender(
    <PublicDocumentPage
      {...props}
      document={{
        __typename: "public_document",
        name: "Literal <name> & document",
        content: "{}",
        publishedAt: "2026-09-21T12:00:00Z",
        updatedAt: "2026-09-21T12:00:00Z",
      }}
    />,
  );

  expect(document.title).toContain("Literal <name> & document");
  expect(
    screen
      .getByRole("link", { name: portuguese ? "Compartilhado com Operately" : "Shared with Operately" })
      .getAttribute("href"),
  ).toBe("https://operately.com");
  expect(screen.queryAllByRole("button")).toHaveLength(0);
  expect(document.querySelector("name")).toBeNull();
});
