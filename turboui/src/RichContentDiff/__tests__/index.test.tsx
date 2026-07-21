import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import React from "react";

import { RichContentDiff } from "../index";
import * as F from "./fixtures";

const mentionedPersonLookup = async () => null;

function renderDiff(before: unknown, after: unknown) {
  return render(<RichContentDiff before={before} after={after} mentionedPersonLookup={mentionedPersonLookup} />);
}

function pane(label: "Before" | "After") {
  return screen.getByRole("region", { name: label });
}

describe("RichContentDiff", () => {
  test("renders inline additions and removals with accessible metadata", async () => {
    renderDiff(F.wordReplaceBefore, F.wordReplaceAfter);

    await waitFor(() => {
      expect(pane("Before").querySelector('[data-diff="removed"]')).toHaveClass("diff-removed");
      expect(pane("After").querySelector('[data-diff="added"]')).toHaveClass("diff-added");
    });

    expect(pane("Before").querySelector('[aria-label="Removed"]')).toBeInTheDocument();
    expect(pane("After").querySelector('[aria-label="Added"]')).toBeInTheDocument();
    expect(screen.getByLabelText("Diff legend")).toHaveTextContent("Removed");
    expect(screen.getByLabelText("Diff legend")).toHaveTextContent("Added");
  });

  test("renders changed blocks and leaf nodes", async () => {
    const { rerender } = renderDiff(F.headingLevelBefore, F.headingLevelAfter);

    await waitFor(() => {
      expect(pane("Before").querySelector(".diff-removed-block")).toBeInTheDocument();
      expect(pane("After").querySelector(".diff-added-block")).toBeInTheDocument();
    });

    rerender(
      <RichContentDiff before={F.mentionBefore} after={F.mentionAfter} mentionedPersonLookup={mentionedPersonLookup} />,
    );

    await waitFor(() => {
      expect(pane("Before").querySelector('[data-diff="removed"]')).toBeInTheDocument();
      expect(pane("After").querySelector('[data-diff="added"]')).toBeInTheDocument();
    });
  });

  test("keeps list markers inside highlighted list items", async () => {
    renderDiff(F.listItemInsertBefore, F.listItemInsertAfter);

    await waitFor(() => {
      expect(pane("After").querySelector("li.diff-added-block")).toBeInTheDocument();
    });

    const styles = document.getElementById("rich-content-diff-styles")?.textContent ?? "";
    expect(styles).toContain("li.diff-added-block");
    expect(styles).toContain('content: "•"');
    expect(styles).toContain("list-style: none");
  });

  test("renders identical documents without change decorations", async () => {
    renderDiff(F.identicalDoc, F.identicalDoc);

    expect(screen.getByText("No content changes")).toBeInTheDocument();
    await waitFor(() => {
      expect(document.querySelector("[data-diff]")).not.toBeInTheDocument();
    });
  });

  test("renders a controlled parse error", () => {
    renderDiff({ type: "paragraph", content: [] }, F.identicalDoc);

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to compare these versions");
  });

  test("updates both content and decorations when snapshots change", async () => {
    const { rerender } = renderDiff(F.charInsertBefore, F.charInsertAfter);

    await waitFor(() => {
      expect(within(pane("After")).getByLabelText("After content")).toHaveTextContent("Hello worlds");
      expect(pane("After").querySelector(".diff-added")).toHaveTextContent("s");
    });

    rerender(
      <RichContentDiff
        before={F.wordReplaceBefore}
        after={F.wordReplaceAfter}
        mentionedPersonLookup={mentionedPersonLookup}
      />,
    );

    await waitFor(() => {
      expect(within(pane("After")).getByLabelText("After content")).toHaveTextContent("The lazy fox");
      expect(pane("After").querySelector(".diff-added")).toHaveTextContent("lazy");
    });
  });

  test("decorates replaced blob leaf nodes", async () => {
    renderDiff(F.blobBefore, F.blobAfter);

    await waitFor(() => {
      expect(pane("Before").querySelector(".node-blob.diff-removed")).toBeInTheDocument();
      expect(pane("After").querySelector(".node-blob.diff-added")).toBeInTheDocument();
    });
  });

  test("renders version labels and document titles inside panes", () => {
    render(
      <RichContentDiff
        before={F.identicalDoc}
        after={F.identicalDoc}
        beforeLabel="Jul 21 at 2:04 PM"
        afterLabel="Jul 21 at 2:05 PM"
        beforeAriaLabel="Earlier version"
        afterAriaLabel="Later version"
        beforeTitle="Old title"
        afterTitle="New title"
        mentionedPersonLookup={mentionedPersonLookup}
      />,
    );

    expect(screen.getByRole("region", { name: "Earlier version" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Later version" })).toBeInTheDocument();
    expect(document.querySelector('[data-test-id="title-removed"]')).toHaveTextContent("Old title");
    expect(document.querySelector('[data-test-id="title-added"]')).toHaveTextContent("New title");
  });
});
