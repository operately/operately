import React from "react";
import { configure, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter, useLocation } from "react-router";
import { defaultFormattedTimePreferences } from "../../FormattedTime";
import { CuratedTemplatesCatalogPage, CuratedTemplatesCatalogProps } from "./index";
import { templateFixture } from "../mockData";

configure({ testIdAttribute: "data-test-id" });

function setup(overrides: Partial<CuratedTemplatesCatalogProps> = {}) {
  const props: CuratedTemplatesCatalogProps = {
    templates: [],
    createPath: "/new",
    administrationPath: "/admin",
    templatePath: () => "/template",
    formattedTimePreferences: defaultFormattedTimePreferences,
    ...overrides,
  };
  function Location() {
    const location = useLocation();
    return (
      <span data-test-id="location">
        {location.pathname}
        {location.search}
      </span>
    );
  }
  render(
    <MemoryRouter>
      <CuratedTemplatesCatalogPage {...props} />
      <Location />
    </MemoryRouter>,
  );
  return props;
}

test("empty catalogs keep creation available without filters or pagination", () => {
  setup();
  expect(screen.getByTestId("create-template")).toHaveAttribute("href", "/new");
  expect(screen.getByTestId("catalog-empty")).toBeInTheDocument();
  expect(screen.queryByTestId("catalog-filters")).not.toBeInTheDocument();
  expect(screen.queryByTestId("catalog-pagination")).not.toBeInTheDocument();
});

test("switching tabs filters the loaded catalog without navigation", () => {
  const templates = [templateFixture("project"), templateFixture("goal"), templateFixture("kpi")];
  setup({ templates });
  expect(screen.getByText(templateFixture("project").title)).toBeInTheDocument();
  expect(screen.queryByText(templateFixture("goal").title)).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId("tab-goal"));
  expect(screen.getByTestId("tab-goal")).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByTestId("tab-project")).toHaveAttribute("aria-pressed", "false");
  expect(screen.getByText(templateFixture("goal").title)).toBeInTheDocument();
  expect(screen.queryByText(templateFixture("project").title)).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId("tab-kpi"));
  expect(screen.getByText(templateFixture("kpi").title)).toBeInTheDocument();
  expect(screen.queryByText(templateFixture("goal").title)).not.toBeInTheDocument();
  expect(screen.getByTestId("location").textContent).toBe("/");
});

test("pagination is local and switching tabs resets it", () => {
  const projects = Array.from({ length: 21 }, (_, i) => ({
    ...templateFixture("project"),
    id: `project-${i}`,
    title: `Project ${i}`,
  }));
  setup({ templates: [...projects, templateFixture("goal")] });
  expect(screen.getByTestId("previous-template-page")).toBeDisabled();
  fireEvent.click(screen.getByTestId("next-template-page"));
  expect(screen.getByText("Project 20")).toBeInTheDocument();
  expect(screen.queryByText("Project 0")).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId("tab-goal"));
  expect(screen.queryByTestId("catalog-pagination")).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId("tab-project"));
  expect(screen.getByText("Project 0")).toBeInTheDocument();
  expect(screen.getByTestId("previous-template-page")).toBeDisabled();
  expect(screen.getByTestId("location").textContent).toBe("/");
});
