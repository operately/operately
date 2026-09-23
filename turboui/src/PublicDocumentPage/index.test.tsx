import React from "react";
import { render, screen } from "@testing-library/react";
import { PublicDocumentPage } from ".";
import { defaultFormattedTimePreferences } from "../FormattedTime";

jest.mock("../RichContent", () => ({ __esModule: true, default: () => <div data-testid="document-content" /> }));

it("renders the document without private workspace controls", () => {
  render(
    <PublicDocumentPage
      formattedTimePreferences={defaultFormattedTimePreferences}
      document={{
        __typename: "public_document",
        name: "Briefing",
        content: "{}",
        publishedAt: "2026-09-21T12:00:00Z",
        updatedAt: "2026-09-21T12:00:00Z",
      }}
    />,
  );
  expect(screen.getByTestId("document-content")).toBeTruthy();
  expect(screen.queryAllByRole("button")).toHaveLength(0);
  expect(screen.queryAllByRole("link")).toHaveLength(0);
  expect(document.querySelector('[data-test-id="navigation"]')).toBeNull();
});

it("replaces the document with an unavailable state when access is lost", () => {
  const props = { formattedTimePreferences: defaultFormattedTimePreferences };
  const { rerender } = render(
    <PublicDocumentPage
      {...props}
      document={{
        __typename: "public_document",
        name: "Briefing",
        content: "{}",
        publishedAt: "2026-09-21T12:00:00Z",
        updatedAt: "2026-09-21T12:00:00Z",
      }}
    />,
  );
  rerender(<PublicDocumentPage {...props} />);
  expect(screen.queryByTestId("document-content")).toBeNull();
  expect(document.querySelector('[data-test-id="public-document-unavailable"]')).toBeTruthy();
});
