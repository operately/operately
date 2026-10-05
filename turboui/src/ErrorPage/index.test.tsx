import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { ErrorPage } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";

setupTestCatalog();

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
