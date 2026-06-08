import React from "react";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";

jest.mock("../icons", () => {
  const React = require("react");
  const Icon = (props) => <svg {...props} />;

  return new Proxy(
    {},
    {
      get: () => Icon,
    },
  );
});

import { DocsAndFilesPreview, DocsAndFilesTab } from ".";
import type { DocsAndFiles } from ".";

const items: DocsAndFiles.Item[] = [
  {
    id: "file-1",
    name: "Beta file",
    type: "file",
    link: "/files/1",
    updatedAt: "2026-01-02T00:00:00Z",
    commentsCount: 2,
    details: ["Ada Lovelace", "24KB"],
  },
  {
    id: "folder-1",
    name: "Alpha folder",
    type: "folder",
    link: "/folders/1",
    updatedAt: "2026-01-01T00:00:00Z",
    details: ["3 items"],
  },
  {
    id: "doc-1",
    name: "Gamma document",
    type: "document",
    link: "/documents/1",
    updatedAt: "2026-01-03T00:00:00Z",
  },
];

function renderWithRouter(component: React.ReactNode) {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{component}</MemoryRouter>,
  );
}

describe("DocsAndFiles", () => {
  it("renders a preview with recent items and hidden count", () => {
    renderWithRouter(<DocsAndFilesPreview items={items} tabPath="/project/docs-and-files" limit={2} />);

    expect(screen.getByText("Gamma document")).toBeInTheDocument();
    expect(screen.getByText("Beta file")).toBeInTheDocument();
    expect(screen.queryByText("Alpha folder")).not.toBeInTheDocument();
    expect(screen.getByText("Show 1 more")).toHaveAttribute("href", "/project/docs-and-files");
  });

  it("keeps folders first in the tab list", () => {
    const { container } = renderWithRouter(<DocsAndFilesTab title="Documents & Files" items={items} />);

    const rows = container.querySelectorAll('[data-test-id^="node-"]');

    expect(within(rows[0]!).getByText("Alpha folder")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Beta file")).toBeInTheDocument();
    expect(within(rows[1]!).getByText("Ada Lovelace · 24KB")).toBeInTheDocument();
  });
});
