import "@testing-library/jest-dom";
import { fireEvent, render } from "@testing-library/react";
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
    navigation: M.navigation,
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

    expect(byTestId("version-selectors")).not.toBeInTheDocument();
    expect(byTestId("back-to-document")).not.toBeInTheDocument();
    expect(byTestId("back-to-history")).not.toBeInTheDocument();
    expect(byTestId("version-label-before")).toBeInTheDocument();
    expect(byTestId("version-label-after")).toBeInTheDocument();
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

  test("first version shows notice", () => {
    renderPage({
      before: null,
      after: M.snapshot(1, M.titles.original, M.contentV1),
    });

    expect(byTestId("first-version-notice")).toBeInTheDocument();
  });

  test("retry calls callback", () => {
    const { props } = renderPage({ comparisonStatus: "error", before: null, after: null });
    fireEvent.click(byTestId("retry-comparison")!);
    expect(props.onRetryComparison).toHaveBeenCalled();
  });
});
