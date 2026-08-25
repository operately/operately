import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { TemplateDiscussionForm } from ".";

function renderForm() {
  return render(
    <MemoryRouter>
      <TemplateDiscussionForm
        pageTitle={["New Discussion", "Launch template"]}
        navigation={[{ to: "/templates", label: "Project Templates" }]}
        richTextHandlers={createMockRichEditorHandlers()}
        cancelLink="/templates/template-1?tab=discussions"
        submitLabel="Post Discussion"
        onSubmit={async () => true}
      />
    </MemoryRouter>,
  );
}

describe("TemplateDiscussionForm", () => {
  it("aligns the cancel link with the submit button", () => {
    renderForm();

    const submitButton = screen.getByRole("button", { name: "Post Discussion" });
    const cancelLink = screen.getByRole("link", { name: "Cancel" });
    const actions = submitButton.parentElement?.parentElement;

    expect(actions).toHaveClass("flex", "items-center");
    expect(actions).toContainElement(cancelLink);
    expect(submitButton.parentElement).toHaveClass("mt-0");
    expect(submitButton.parentElement).not.toHaveClass("mt-8");
    expect(cancelLink).toHaveClass("inline-flex", "items-center");
  });
});
