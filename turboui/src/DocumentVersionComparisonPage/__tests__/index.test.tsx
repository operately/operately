import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";

import { defaultFormattedTimePreferences } from "../../FormattedTime";
import * as M from "../../DocumentVersionHistoryPage/mockData";
import { DocumentVersionComparisonPage } from "../index";

const mentionedPersonLookup = async () => null;

function byTestId(id: string) {
  return document.querySelector(`[data-test-id="${id}"]`) as HTMLElement | null;
}

function renderPage(overrides: Partial<DocumentVersionComparisonPage.Props> = {}) {
  const props: DocumentVersionComparisonPage.Props = {
    title: ["See what changed", M.titles.current],
    navigation: M.comparisonNavigation,
    versions: M.multiVersionList,
    before: M.snapshot(4, M.titles.renamed, M.contentV1),
    after: M.snapshot(5, M.titles.current, M.contentV2),
    comparisonStatus: "ready",
    formattedTimePreferences: defaultFormattedTimePreferences,
    mentionedPersonLookup,
    onRetryComparison: jest.fn(),
    ...overrides,
  };

  return {
    props,
    ...render(
      <MemoryRouter>
        <DocumentVersionComparisonPage {...props} />
      </MemoryRouter>,
    ),
  };
}

describe("DocumentVersionComparisonPage", () => {
  test("renders adjacent version comparison", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "See what changed" })).toBeInTheDocument();
    expect(screen.getByLabelText("Diff legend")).toBeInTheDocument();
    expect(byTestId("version-selectors")).not.toBeInTheDocument();
    expect(byTestId("version-label-before")).toHaveTextContent("at");
    expect(byTestId("version-label-after")).toHaveTextContent("at");
    expect(byTestId("title-removed")).toHaveTextContent(M.titles.renamed);
    expect(byTestId("title-added")).toHaveTextContent(M.titles.current);
  });

  test("title-only changes show no content-diff notice", () => {
    renderPage({
      before: M.snapshot(3, M.titles.original, M.contentTitleOnly),
      after: M.snapshot(4, M.titles.renamed, M.contentTitleOnly),
    });

    expect(byTestId("no-content-changes")).toBeInTheDocument();
  });

  test("missing snapshots show unavailable state", () => {
    renderPage({
      before: null,
      after: M.snapshot(1, M.titles.original, M.contentV1),
    });

    expect(byTestId("version-unavailable")).toBeInTheDocument();
  });

  test("idle comparison shows the loading workspace", () => {
    renderPage({ comparisonStatus: "idle", before: null, after: null });

    expect(screen.getByRole("status", { name: "Loading comparison" })).toBeInTheDocument();
  });

  test("retry calls callback", () => {
    const { props } = renderPage({ comparisonStatus: "error", before: null, after: null });
    fireEvent.click(byTestId("retry-comparison")!);
    expect(props.onRetryComparison).toHaveBeenCalled();
  });
});
