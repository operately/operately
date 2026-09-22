import * as React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { OngoingDraftActions } from "./index";
import { defaultFormattedTimePreferences } from "../FormattedTime";

const baseProps = {
  state: "draft" as const,
  updatedAt: "2026-05-14T12:00:00Z",
  editPath: "/discussions/1/edit",
  formattedTimePreferences: defaultFormattedTimePreferences,
};

describe("OngoingDraftActions", () => {
  test("shows publish when onPublish is provided", () => {
    render(
      <MemoryRouter>
        <OngoingDraftActions {...baseProps} onPublish={jest.fn()} />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="publish-now"]')).toBeInTheDocument();
  });

  test("hides publish when onPublish is omitted", () => {
    render(
      <MemoryRouter>
        <OngoingDraftActions {...baseProps} />
      </MemoryRouter>,
    );

    expect(document.querySelector('[data-test-id="publish-now"]')).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-id="continue-editing"]')).toBeInTheDocument();
  });
});
