import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PageDocsAndFilesTab, type PageDocsAndFiles } from "./PageDocsAndFiles";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";

jest.mock("../ResourceHub", () => ({
  ...jest.requireActual("../ResourceHub"),
  NewFileModalsProvider: () => <div data-testid="docs-content" />,
}));
const props = { formattedTimePreferences: defaultFormattedTimePreferences };

it("shows the document skeleton until data arrives", () => {
  const { rerender } = render(<PageDocsAndFilesTab {...props} loading />);
  expect(screen.getByRole("heading", { name: "Docs & Files" })).toBeInTheDocument();
  expect(screen.getByRole("status")).toBeInTheDocument();
  expect(screen.queryByTestId("docs-content")).not.toBeInTheDocument();
  rerender(<PageDocsAndFilesTab {...props} docsAndFiles={{} as PageDocsAndFiles} />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.getByTestId("docs-content")).toBeInTheDocument();
});

it("offers retry after failure and keeps cached docs visible", () => {
  const retry = jest.fn();
  render(<PageDocsAndFilesTab {...props} docsAndFiles={{} as PageDocsAndFiles} error onRetry={retry} />);
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByTestId("docs-content")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(retry).toHaveBeenCalledTimes(1);
});
