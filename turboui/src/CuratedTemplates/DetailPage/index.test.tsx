import React from "react";
import { render, fireEvent, screen, waitFor, configure } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import { CuratedTemplateDetailPage } from "./index";
import { templateFixture } from "../mockData";

configure({ testIdAttribute: "data-test-id" });

function setup(state: "draft" | "published" = "draft") {
  const onDelete = jest.fn().mockResolvedValue(undefined);
  const onPublish = jest.fn().mockResolvedValue({ errors: [{ path: "definition.unit", message: "Required" }] });
  render(
    <MemoryRouter>
      <CuratedTemplateDetailPage
        template={{
          ...templateFixture("kpi"),
          definition: "{}",
          state,
        }}
        catalogPath="/"
        onSave={onPublish}
        onCancel={jest.fn()}
        onDelete={onDelete}
      />
    </MemoryRouter>,
  );
  return { onPublish, onDelete };
}

test("publication errors keep an incomplete template in draft", async () => {
  const { onPublish } = setup();
  fireEvent.click(screen.getByTestId("publish-template"));
  await waitFor(() => expect(onPublish).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(screen.getByTestId("template-errors")).toBeInTheDocument());
  expect(screen.getByTestId("definition-unit")).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByTestId("template-state")).toHaveAttribute("data-state", "draft");
});

test("unsaved edits can be published", () => {
  setup();
  fireEvent.change(screen.getByTestId("title"), { target: { value: "Unsaved KPI" } });
  expect(screen.getByTestId("publish-template")).toBeEnabled();
});

test.each(["draft", "published"] as const)("deletes a %s template after confirmation", async (state) => {
  const { onDelete } = setup(state);
  fireEvent.keyDown(screen.getByTestId("template-actions"), { key: "ArrowDown" });
  fireEvent.click(await screen.findByTestId("delete-template"));
  expect(onDelete).not.toHaveBeenCalled();
  fireEvent.click(screen.getByTestId("template-action-confirmation-confirm"));
  await waitFor(() => expect(onDelete).toHaveBeenCalledTimes(1));
});
