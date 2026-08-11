import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { TemplateResourcePage } from ".";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asRichText } from "../utils/storybook/richContent";

function renderPage(resource: React.ComponentProps<typeof TemplateResourcePage>["resource"]) {
  return render(
    <MemoryRouter>
      <TemplateResourcePage
        pageTitle={[resource.name, "Launch template"]}
        navigation={[{ to: "/templates/template-1", label: "Launch template" }]}
        resource={resource}
        richTextHandlers={createMockRichEditorHandlers()}
      />
    </MemoryRouter>,
  );
}

describe("TemplateResourcePage", () => {
  it("renders a published document without runtime document controls", () => {
    renderPage({ name: "Launch guide", type: "document", content: asRichText("Reuse this plan.") });

    expect(screen.getByText("Launch guide")).toBeInTheDocument();
    expect(screen.getByText("Reuse this plan.")).toBeInTheDocument();
    expect(screen.queryByText("Versions")).not.toBeInTheDocument();
    expect(screen.queryByText("Comments")).not.toBeInTheDocument();
  });

  it("lists nested folder contents", () => {
    renderPage({
      name: "Assets",
      type: "folder",
      items: [
        {
          id: "document-1",
          name: "Launch guide",
          type: "document",
          link: "/templates/template-1/docs-and-files/document-1",
          insertedAt: "2026-08-11T12:00:00Z",
          updatedAt: "2026-08-11T12:00:00Z",
        },
      ],
    });

    expect(screen.getByText("Launch guide").closest("a")).toHaveAttribute(
      "href",
      "/templates/template-1/docs-and-files/document-1",
    );
    expect(screen.queryByText("Add")).not.toBeInTheDocument();
  });
});
