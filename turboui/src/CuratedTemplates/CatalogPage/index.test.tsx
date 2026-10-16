import React from "react";
import { configure, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import userEvent from "@testing-library/user-event";
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
    previewPath: (template) => `/template/${template.id}/preview`,
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

test("all templates in the selected tab are shown without pagination", () => {
  const projects = Array.from({ length: 21 }, (_, i) => ({
    ...templateFixture("project"),
    id: `project-${i}`,
    title: `Project ${i}`,
  }));
  setup({ templates: [...projects, templateFixture("goal")] });
  for (const project of projects) {
    expect(screen.getByText(project.title)).toBeInTheDocument();
  }
  expect(screen.queryByTestId("catalog-pagination")).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId("tab-goal"));
  expect(screen.queryByText("Project 0")).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId("tab-project"));
  for (const project of projects) {
    expect(screen.getByText(project.title)).toBeInTheDocument();
  }
  expect(screen.getByTestId("location").textContent).toBe("/");
});

test("uses the parent's selected tab and reports tab changes", () => {
  const onSelectedTypeChange = jest.fn();
  setup({
    templates: [templateFixture("project"), templateFixture("goal"), templateFixture("kpi")],
    selectedType: "goal",
    onSelectedTypeChange,
  });
  expect(screen.getByTestId("tab-goal")).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByText(templateFixture("goal").title)).toBeInTheDocument();
  expect(screen.queryByText(templateFixture("project").title)).not.toBeInTheDocument();
  fireEvent.click(screen.getByTestId("tab-kpi"));
  expect(onSelectedTypeChange).toHaveBeenCalledWith("kpi");
  expect(screen.getByTestId("tab-goal")).toHaveAttribute("aria-pressed", "true");
});

test("catalog preview links open in a new tab and explain the icon on hover", async () => {
  const user = userEvent.setup();
  const template = templateFixture("project");
  setup({ templates: [template] });
  const link = screen.getByTestId(`preview-template-${template.id}`);
  expect(link).toHaveAttribute("href", `/template/${template.id}/preview`);
  expect(link).toHaveAttribute("target", "_blank");
  expect(link).toHaveAccessibleName();
  await user.hover(link);
  const tooltip = await screen.findByRole("tooltip");
  expect(tooltip).toHaveTextContent(link.getAttribute("aria-label") ?? "");
});
