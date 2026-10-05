import React from "react";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { PeoplePage } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";
import type { Person } from "../ApiTypes";

setupTestCatalog();
const person: Person = {
  __typename: "person",
  id: "person",
  fullName: "Ana <resource> & Co",
  title: "Designer",
  email: "ana@example.com",
  avatarUrl: null,
  type: "member",
};

function renderPeople(people = [person]) {
  return render(
    <MemoryRouter>
      <PeoplePage companyName="Acme <strong> & Co" people={people} profileHref={(id) => `/people/${id}`} />
    </MemoryRouter>,
  );
}

test.each(["en", "pt-BR"])("renders directory copy in %s and preserves literal names and links", async (language) => {
  await i18n.changeLanguage(language);
  renderPeople();
  expect(screen.getByRole("heading")).toHaveTextContent(
    language === "en" ? "Members of Acme <strong> & Co" : "Membros de Acme <strong> & Co",
  );
  expect(screen.getByRole("link", { name: person.fullName })).toHaveAttribute("href", "/people/person");
  expect(screen.getByText(person.title)).toBeVisible();
  expect(document.querySelector("strong, resource")).toBeNull();
});

test("uses reordered catalog wording and preserves the empty directory", () => {
  i18n.addResource("en", "translation", "Members of {{company}}", "{{company}} — directory");
  renderPeople([]);
  expect(screen.getByRole("heading")).toHaveTextContent("Acme <strong> & Co — directory");
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});

test("falls back to English for a missing Portuguese sentence", async () => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  renderPeople();
  expect(screen.getByRole("heading")).toHaveTextContent("Members of Acme <strong> & Co");
});
