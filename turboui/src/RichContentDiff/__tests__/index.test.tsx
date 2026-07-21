import "@testing-library/jest-dom";
import { render, screen, waitFor, within } from "@testing-library/react";
import React from "react";

import { RichContentDiff } from "../index";
import * as F from "./fixtures";

const mentionedPersonLookup = async () => null;

function renderDiff(before: unknown, after: unknown) {
  return render(<RichContentDiff before={before} after={after} mentionedPersonLookup={mentionedPersonLookup} />);
}

function pane(label: "Removed" | "Added") {
  return screen.getByRole("region", { name: `${label} version` });
}

describe("RichContentDiff", () => {
  test("renders inline additions and removals with accessible metadata", async () => {
    renderDiff(F.wordReplaceBefore, F.wordReplaceAfter);

    await waitFor(() => {
      expect(pane("Removed").querySelector('[data-diff="removed"]')).toHaveClass("diff-removed");
      expect(pane("Added").querySelector('[data-diff="added"]')).toHaveClass("diff-added");
    });

    expect(pane("Removed").querySelector('[aria-label="Removed"]')).toBeInTheDocument();
    expect(pane("Added").querySelector('[aria-label="Added"]')).toBeInTheDocument();
  });

  test("renders changed blocks and leaf nodes", async () => {
    const { rerender } = renderDiff(F.headingLevelBefore, F.headingLevelAfter);

    await waitFor(() => {
      expect(pane("Removed").querySelector(".diff-removed-block")).toBeInTheDocument();
      expect(pane("Added").querySelector(".diff-added-block")).toBeInTheDocument();
    });

    rerender(
      <RichContentDiff before={F.mentionBefore} after={F.mentionAfter} mentionedPersonLookup={mentionedPersonLookup} />,
    );

    await waitFor(() => {
      expect(pane("Removed").querySelector('[data-diff="removed"]')).toBeInTheDocument();
      expect(pane("Added").querySelector('[data-diff="added"]')).toBeInTheDocument();
    });
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
      expect(within(pane("Added")).getByLabelText("Added version content")).toHaveTextContent("Hello worlds");
      expect(pane("Added").querySelector(".diff-added")).toHaveTextContent("s");
    });

    rerender(
      <RichContentDiff
        before={F.wordReplaceBefore}
        after={F.wordReplaceAfter}
        mentionedPersonLookup={mentionedPersonLookup}
      />,
    );

    await waitFor(() => {
      expect(within(pane("Added")).getByLabelText("Added version content")).toHaveTextContent("The lazy fox");
      expect(pane("Added").querySelector(".diff-added")).toHaveTextContent("lazy");
    });
  });
});
