import React from "react";
import { render, screen, configure, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import { defaultFormattedTimePreferences } from "../../FormattedTime";
import { templateFixture } from "../mockData";
import { TemplateDetails } from "./TemplateDetails";

configure({ testIdAttribute: "data-test-id" });

test("shows metadata, rich descriptions, and localized KPI example data without editing controls", () => {
  const template = {
    ...templateFixture("kpi"),
    summary: "Track recurring revenue.",
    category: "Sales",
    definition: JSON.stringify({
      unit: "USD",
      cadence: "monthly",
      description: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "<script>Keep this literal</script>" }] }],
      },
    }),
    previewData: JSON.stringify({
      entries: [
        { period_offset: -1, value: 1234.5 },
        { period_offset: 0, value: 0 },
      ],
      annotations: [{ period_offset: 0, title: "Campaign launch" }],
    }),
  };
  const { container } = render(
    <MemoryRouter>
      <TemplateDetails
        template={template}
        formattedTimePreferences={{ ...defaultFormattedTimePreferences, locale: "pt-BR" }}
      />
    </MemoryRouter>,
  );
  expect(screen.getByText(template.summary)).toBeInTheDocument();
  expect(screen.getByText(template.category)).toBeInTheDocument();
  expect(screen.getByText("<script>Keep this literal</script>")).toBeInTheDocument();
  expect(container.querySelector("script, input, textarea, [contenteditable='true']")).toBeNull();
  const example = within(screen.getByTestId("template-example-data"));
  expect(example.getByText("1.234,5")).toBeInTheDocument();
  expect(example.getByText("Campaign launch")).toBeInTheDocument();
  expect(example.getAllByText("0")).toHaveLength(3);
});

test.each(["kpi", "goal", "project"] as const)(
  "renders incomplete %s drafts without child rows or example values",
  (type) => {
    render(
      <TemplateDetails
        template={{ ...templateFixture(type), definition: "{}" }}
        formattedTimePreferences={defaultFormattedTimePreferences}
      />,
    );
    expect(screen.getByTestId("template-details")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("heading", { level: 3 })).toHaveLength(type === "kpi" ? 1 : 0);
  },
);
