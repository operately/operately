import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router";

import { defaultFormattedTimePreferences } from "../../FormattedTime";
import * as M from "../../DocumentVersionHistoryPage/mockData";
import { DocumentVersionComparisonPage } from "../index";
import { i18n, setupTestCatalog } from "../../../test/i18n";

setupTestCatalog();

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
  test("looks up expanded comparison errors and preserves retry", () => {
    i18n.addResourceBundle(
      "en",
      "translation",
      {
        "See what changed": "Expanded translated comparison heading for this document",
        "Unable to load this comparison": "Translated comparison unavailable",
        "One of the selected versions could not be loaded. Try again or choose another version from the history.":
          "Expanded translated explanation with another version as a recovery option.",
        Retry: "Translated retry",
      },
      true,
      true,
    );
    const { props } = renderPage({ comparisonStatus: "error" });
    expect(
      screen.getByRole("heading", { name: "Expanded translated comparison heading for this document" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Translated comparison unavailable");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Expanded translated explanation with another version as a recovery option.",
    );
    fireEvent.click(screen.getByRole("button", { name: "Translated retry" }));
    expect(props.onRetryComparison).toHaveBeenCalledTimes(1);
  });

  test("looks up the no-changes state while keeping document titles intact", () => {
    i18n.addResourceBundle(
      "en",
      "translation",
      {
        "No content changes between these versions.": "Translated unchanged document content",
      },
      true,
      true,
    );
    renderPage({
      before: M.snapshot(3, M.titles.original, M.contentTitleOnly),
      after: M.snapshot(4, M.titles.renamed, M.contentTitleOnly),
    });
    expect(screen.getByText("Translated unchanged document content")).toBeInTheDocument();
    expect(byTestId("title-removed")).toHaveTextContent(M.titles.original);
    expect(byTestId("title-added")).toHaveTextContent(M.titles.renamed);
  });

  test("falls back to English loading accessibility text with missing Portuguese", async () => {
    i18n.removeResourceBundle("pt-BR", "translation");
    await i18n.changeLanguage("pt-BR");
    renderPage({ comparisonStatus: "loading" });
    expect(screen.getByRole("status", { name: "Loading comparison" })).toHaveTextContent("Loading comparison…");
  });

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
