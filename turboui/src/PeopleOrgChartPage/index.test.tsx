import React from "react";
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { PeopleOrgChartPage } from ".";
import { i18n, setupTestCatalog } from "../../test/i18n";
import type { Person } from "../ApiTypes";

setupTestCatalog();
const person: Person = {
  __typename: "person",
  id: "manager",
  fullName: "Ana <resource> & Co",
  title: "Designer",
  email: "ana@example.com",
  avatarUrl: null,
  type: "member",
};
function chart(count: number): PeopleOrgChartPage.Chart {
  const root = { person, directReports: count, totalReports: count };
  return { root: [root], nodes: [root], expanded: [], toggle: jest.fn(), collapse: jest.fn() };
}
function renderChart(value: PeopleOrgChartPage.Chart) {
  return render(
    <MemoryRouter>
      <PeopleOrgChartPage chart={value} profileHref={(id) => `/people/${id}`} idsMatch={(a, b) => !!a && a === b} />
    </MemoryRouter>,
  );
}

test.each([0, 1, 2])("Portuguese report counts and actions use the catalog: %i", async (count) => {
  await i18n.changeLanguage("pt-BR");
  const value = chart(count);
  renderChart(value);
  expect(screen.getByRole("heading")).toHaveTextContent("Organograma");
  const button = screen.getByRole("button", {
    name: `Expandir ${count} ${count === 1 ? "subordinado" : "subordinados"} de ${person.fullName}`,
  });
  expect(screen.getByRole("link", { name: person.fullName })).toHaveAttribute("href", "/people/manager");
  if (count === 0) expect(button).toBeDisabled();
  fireEvent.click(button);
  expect(value.toggle).toHaveBeenCalledTimes(count === 0 ? 0 : 1);
  if (count > 0) expect(value.toggle).toHaveBeenCalledWith(person.id);
});

test.each([0, 1, 2])("missing Portuguese plurals fall back to English: %i", async (count) => {
  i18n.removeResourceBundle("pt-BR", "translation");
  await i18n.changeLanguage("pt-BR");
  renderChart(chart(count));
  expect(
    screen.getByRole("button", {
      name: `Expand ${count} ${count === 1 ? "report" : "reports"} for ${person.fullName}`,
    }),
  ).toBeInTheDocument();
});

test("expanded charts use substituted labels and keep report links and callbacks", () => {
  i18n.addResourceBundle(
    "en",
    "translation",
    {
      "Org Chart": "Translated chart",
      Collapse: "Translated collapse",
      "Collapse reports for {{name}}": "{{name}} — hide reports",
    },
    true,
    true,
  );
  const value = chart(1);
  value.expanded = [person.id];
  value.nodes.push({
    person: { ...person, id: "report", fullName: "Report name", manager: person },
    directReports: 0,
    totalReports: 0,
  });
  renderChart(value);
  expect(screen.getByRole("heading")).toHaveTextContent("Translated chart");
  expect(screen.getByRole("link", { name: "Report name" })).toHaveAttribute("href", "/people/report");
  fireEvent.click(screen.getByText("Translated collapse"));
  expect(value.collapse).toHaveBeenCalledWith(person.id);
  const [toggle] = screen.getAllByRole("button", { name: `${person.fullName} — hide reports` });
  if (!toggle) throw new Error("Missing report toggle");
  fireEvent.click(toggle);
  expect(value.toggle).toHaveBeenCalledWith(person.id);
  expect(document.querySelector("resource")).toBeNull();
});
