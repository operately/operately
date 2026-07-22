import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";

import { defaultFormattedTimePreferences } from "../../FormattedTime";
import { DocumentVersionHistoryPage } from "../index";
import * as M from "../mockData";
import type { DocumentVersionHistoryPageProps } from "../types";

const mentionedPersonLookup = async () => null;

function byTestId(id: string) {
  return document.querySelector(`[data-test-id="${id}"]`) as HTMLElement | null;
}

function renderPage(overrides: Partial<DocumentVersionHistoryPageProps> = {}) {
  const props: DocumentVersionHistoryPageProps = {
    title: ["History of changes", M.titles.current],
    navigation: M.navigation,
    currentTitle: M.titles.current,
    currentContent: M.contentV2,
    versions: M.multiVersionList,
    formattedTimePreferences: defaultFormattedTimePreferences,
    mentionedPersonLookup,
    getComparisonPath: (versionNumber) => `/documents/1/versions/${versionNumber}`,
    ...overrides,
  };

  return render(
    <MemoryRouter>
      <DocumentVersionHistoryPage {...props} />
    </MemoryRouter>,
  );
}

describe("DocumentVersionHistoryPage", () => {
  test("renders preview and timeline with action links for comparable versions", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "History of changes" })).toBeInTheDocument();
    expect(screen.getByLabelText("Current document")).toBeInTheDocument();
    expect(screen.getByLabelText("Version history")).toBeInTheDocument();
    expect(byTestId("current-document-preview")).toHaveTextContent(M.titles.current);
    expect(byTestId("version-row-5")).toHaveTextContent("Grace Wilson");
    expect(byTestId("version-row-5")).toHaveTextContent("Version 5");
    expect(byTestId("version-row-5")).toHaveTextContent("Current");
    expect(byTestId("version-row-5")).toHaveTextContent("changed the title of this document");
    expect(byTestId("see-what-changed-5")).toHaveTextContent("See what changed");
    expect(byTestId("see-what-changed-5")).toHaveAttribute("href", "/documents/1/versions/5");
    expect(byTestId("view-version-1")).not.toBeInTheDocument();
    expect(byTestId("see-what-changed-1")).not.toBeInTheDocument();
  });

  test("one-version history has no comparison link", () => {
    renderPage({
      versions: M.oneVersionList,
      currentTitle: M.titles.oneVersion,
      currentContent: M.contentV1,
    });

    expect(byTestId("version-row-1")).toHaveTextContent("created this document");
    expect(byTestId("view-version-1")).not.toBeInTheDocument();
    expect(byTestId("see-what-changed-1")).not.toBeInTheDocument();
  });
});
