import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
    expect(screen.getByLabelText("Selected version")).toBeInTheDocument();
    expect(screen.getByLabelText("Version history")).toBeInTheDocument();
    expect(byTestId("selected-version-preview")).toHaveTextContent(M.titles.current);
    expect(byTestId("version-dot-5")).toHaveAttribute("data-selected", "true");
    expect(byTestId("version-dot-4")).toHaveAttribute("data-selected", "false");
    expect(byTestId("version-row-5")).toHaveTextContent("Grace Wilson");
    expect(byTestId("version-row-5")).toHaveTextContent("Latest");
    expect(byTestId("version-row-5")).toHaveTextContent("at");
    expect(byTestId("version-row-5")).toHaveTextContent("updated this document");
    expect(byTestId("version-row-4")).toHaveTextContent("changed the title of this document");
    expect(byTestId("see-what-changed-5")).toHaveTextContent("See what changed");
    expect(byTestId("see-what-changed-5")).toHaveAttribute("href", "/documents/1/versions/5");
    expect(byTestId("view-version-1")).not.toBeInTheDocument();
    expect(byTestId("see-what-changed-1")).not.toBeInTheDocument();
    expect(byTestId("restore-this-version")).not.toBeInTheDocument();
  });

  test("clicking a timeline row updates the preview and filled circle", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(byTestId("select-version-4")!);

    expect(byTestId("selected-version-preview")).toHaveTextContent(M.titles.renamed);
    expect(byTestId("version-dot-4")).toHaveAttribute("data-selected", "true");
    expect(byTestId("version-dot-5")).toHaveAttribute("data-selected", "false");
    expect(byTestId("see-what-changed-4")).toHaveAttribute("href", "/documents/1/versions/4");
  });

  test("shows restore for editable non-current selection and confirms", async () => {
    const user = userEvent.setup();
    const onRestore = jest.fn().mockResolvedValue("ok");

    renderPage({
      canRestore: true,
      currentVersionNumber: 5,
      onRestore,
    });

    expect(byTestId("restore-this-version")).not.toBeInTheDocument();

    await user.click(byTestId("select-version-4")!);
    expect(byTestId("restore-this-version")).toBeInTheDocument();

    await user.click(byTestId("restore-this-version")!);
    expect(byTestId("restore-version-confirm")).toBeInTheDocument();
    expect(byTestId("restore-version-confirm")).toHaveTextContent("Restore this version?");

    await user.click(screen.getByRole("button", { name: "Restore" }));
    expect(onRestore).toHaveBeenCalledWith(4, 5);
  });

  test("reload after conflict selects the latest version", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [versions, setVersions] = React.useState(M.multiVersionList);
      const [currentVersionNumber, setCurrentVersionNumber] = React.useState(5);

      return (
        <DocumentVersionHistoryPage
          title={["History of changes", M.titles.current]}
          navigation={M.navigation}
          versions={versions}
          formattedTimePreferences={defaultFormattedTimePreferences}
          mentionedPersonLookup={mentionedPersonLookup}
          getComparisonPath={(versionNumber) => `/documents/1/versions/${versionNumber}`}
          canRestore
          currentVersionNumber={currentVersionNumber}
          onRestore={async () => "conflict"}
          onReload={() => {
            setVersions([
              {
                ...M.multiVersionList[0]!,
                id: "ver-6",
                versionNumber: 6,
                isCurrent: true,
                title: "After concurrent edit",
              },
              ...M.multiVersionList.map((version) => ({ ...version, isCurrent: false })),
            ]);
            setCurrentVersionNumber(6);
          }}
        />
      );
    }

    render(
      <MemoryRouter>
        <Harness />
      </MemoryRouter>,
    );

    await user.click(byTestId("select-version-4")!);
    expect(byTestId("version-dot-4")).toHaveAttribute("data-selected", "true");

    await user.click(byTestId("restore-this-version")!);
    await user.click(screen.getByRole("button", { name: "Restore" }));

    expect(byTestId("restore-conflict")).toBeInTheDocument();
    expect(byTestId("restore-conflict")).toHaveTextContent("Document changed since you opened it");

    await user.click(screen.getByRole("button", { name: "Reload" }));

    expect(byTestId("version-dot-6")).toHaveAttribute("data-selected", "true");
    expect(byTestId("selected-version-preview")).toHaveTextContent("After concurrent edit");
  });

  test("one-version history has no comparison link", () => {
    renderPage({
      versions: M.oneVersionList,
    });

    expect(byTestId("version-row-1")).toHaveTextContent("created this document");
    expect(byTestId("selected-version-preview")).toHaveTextContent(M.titles.oneVersion);
    expect(byTestId("version-dot-1")).toHaveAttribute("data-selected", "true");
    expect(byTestId("view-version-1")).not.toBeInTheDocument();
    expect(byTestId("see-what-changed-1")).not.toBeInTheDocument();
  });
});
