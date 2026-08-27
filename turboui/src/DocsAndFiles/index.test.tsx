import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { DocsAndFilesTab } from ".";

describe("DocsAndFilesTab", () => {
  test("renders compact author and update metadata for a document", () => {
    render(
      <MemoryRouter>
        <DocsAndFilesTab
          title="Documents & Files"
          formattedTimePreferences={defaultFormattedTimePreferences}
          items={[
            {
              id: "document-1",
              name: "Quarterly plan",
              type: "document",
              link: "/documents/document-1",
              updatedAt: "2026-08-26T12:00:00Z",
              author: {
                id: "person-1",
                fullName: "Alice Example",
                avatarUrl: null,
              },
              details: ["Plan summary"],
            },
          ]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText("Alice E.")).toBeInTheDocument();
    expect(screen.getByTitle("Alice Example")).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="resource-hub-node-updated-at"]')).toHaveTextContent("Updated");
    expect(screen.getByText("DOC")).toBeInTheDocument();
    expect(screen.getByText("Plan summary")).not.toHaveClass("hidden");
    expect(screen.getByText("Plan summary")).toHaveClass("basis-full");
  });
});
