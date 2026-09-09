import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DocsAndFilesSection } from "./DocsAndFilesSection";
import type { ProjectPage } from ".";

jest.mock("../DocsAndFiles/PageDocsAndFiles", () => ({
  PageDocsAndFilesTab: () => <div data-testid="docs-content" />,
}));
const state = { docsAndFilesAvailable: true } as ProjectPage.State;

it("shows the document skeleton until data arrives", () => {
  const { rerender } = render(<DocsAndFilesSection state={{ ...state, docsAndFilesLoading: true }} />);
  expect(screen.getByRole("heading", { name: "Docs & Files" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(screen.queryByTestId("docs-content")).not.toBeInTheDocument();
  rerender(<DocsAndFilesSection state={{ ...state, docsAndFiles: {} as ProjectPage.DocsAndFiles }} />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByTestId("docs-content")).toBeInTheDocument();
});

it("offers retry after failure and keeps cached docs visible", () => {
  const retry = jest.fn();
  render(
    <DocsAndFilesSection
      state={{
        ...state,
        docsAndFiles: {} as ProjectPage.DocsAndFiles,
        docsAndFilesError: true,
        onRetryDocsAndFiles: retry,
      }}
    />,
  );
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByTestId("docs-content")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(retry).toHaveBeenCalledTimes(1);
});
