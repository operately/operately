import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ErrorPage } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

const translations = {
  de: require("../../../app/assets/js/generated/locales/de.json"),
  es: require("../../../app/assets/js/generated/locales/es.json"),
  fr: require("../../../app/assets/js/generated/locales/fr.json"),
  ru: require("../../../app/assets/js/generated/locales/ru.json"),
};
beforeEach(() => {
  for (const [language, resources] of Object.entries(translations)) {
    i18n.addResourceBundle(language, "translation", resources, true, true);
  }
});

test.each(["en", "pt-BR", "missing"])("error states, destinations, and fallback: %s", async (language) => {
  if (language === "missing") i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage(language === "missing" ? "pt-BR" : language);
  const portuguese = language === "pt-BR";

  const view = render(
    <MemoryRouter>
      <ErrorPage status={404} />
    </MemoryRouter>,
  );

  expect(screen.getByText(portuguese ? "Página não encontrada" : "Page Not Found")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: portuguese ? "Voltar para o Lobby" : "Go back to Lobby" })).toHaveAttribute(
    "href",
    "/",
  );

  view.rerender(
    <MemoryRouter>
      <ErrorPage status={500} homePath="/company" />
    </MemoryRouter>,
  );

  expect(screen.getByText(portuguese ? "Ops! Algo deu errado." : "Oops! Something went wrong.")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: portuguese ? "Voltar para o Início" : "Go back to Home" })).toHaveAttribute(
    "href",
    "/company",
  );
  expect(screen.queryByText("Error Stack Trace")).not.toBeInTheDocument();
});

test("catalog substitutions preserve literal diagnostics", () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "Oops! Something went wrong.": "Translated heading",
      "An unexpected error has occurred.": "Translated explanation",
      "Error Stack Trace": "Translated diagnostics",
      "This error is visible only in dev and test environments.": "Translated notice",
    },
    true,
    true,
  );

  render(
    <MemoryRouter>
      <ErrorPage status={500} diagnostics={{ stack: "Literal <script> & stack" }} />
    </MemoryRouter>,
  );

  expect(screen.getByText("Translated heading")).toBeInTheDocument();
  expect(screen.getByText("Translated explanation")).toBeInTheDocument();
  expect(screen.getByText("Translated diagnostics")).toBeInTheDocument();
  expect(screen.getByText("Translated notice")).toBeInTheDocument();
  expect(screen.getByText("Literal <script> & stack")).toBeInTheDocument();
  expect(document.querySelector("script")).toBeNull();
});

test.each([
  ["en", "Temporarily unavailable", "We can't load this page right now. Please try again."],
  ["pt-BR", "Temporariamente indisponível", "Não foi possível carregar esta página agora. Tente novamente."],
  ["de", "Vorübergehend nicht verfügbar", "Diese Seite kann gerade nicht geladen werden. Bitte versuche es erneut."],
  ["es", "Temporalmente no disponible", "No podemos cargar esta página en este momento. Inténtalo de nuevo."],
  ["fr", "Temporairement indisponible", "Nous ne pouvons pas charger cette page pour le moment. Veuillez réessayer."],
  ["ru", "Временно недоступно", "Сейчас не удаётся загрузить эту страницу. Попробуйте ещё раз."],
])("renders the translated 503 state: %s", async (language, title, description) => {
  await i18n.changeLanguage(language);
  render(
    <MemoryRouter>
      <ErrorPage status={503} homePath="/company" />
    </MemoryRouter>,
  );
  expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  expect(screen.getByText(description)).toBeInTheDocument();
  expect(screen.getByRole("link")).toHaveAttribute("href", "/company");
  expect(screen.getByRole("main")).toHaveAttribute("data-status", "503");
});
