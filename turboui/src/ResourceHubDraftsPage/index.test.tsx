import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

jest.mock("../icons", () => ({
  IconAlignJustified: () => <span>align-justified</span>,
  IconChartColumn: () => <span>chart-column</span>,
  IconDots: () => <span>menu-dots</span>,
  IconFolderFilled: () => <span>folder</span>,
  IconLink: () => <span>link</span>,
  IconLogs: () => <span>logs</span>,
  IconSlash: () => <span>slash</span>,
  IconVideo: () => <span>video</span>,
}));

import { ResourceHubDraftsPage } from "./index";
import { createMockDraftNode, createMockResourceHub } from "../ResourceHubPage/mockData";

function ResourceHubDraftsPageHarness({
  nodes,
}: {
  nodes: React.ComponentProps<typeof ResourceHubDraftsPage>["nodes"];
}) {
  const [resourceHub] = React.useState(() => createMockResourceHub());

  return (
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ResourceHubDraftsPage
        title={["Drafts", resourceHub.name ?? "Resource Hub"]}
        navigation={[
          { to: `/spaces/${resourceHub.space?.id}`, label: resourceHub.space?.name ?? "Operations" },
          { to: `/resource-hubs/${resourceHub.id}`, label: resourceHub.name ?? "Resource Hub" },
        ]}
        nodes={nodes}
        getNodePath={(node) => `/resource-hubs/documents/${node.document?.id ?? node.id}`}
      />
    </MemoryRouter>
  );
}

describe("ResourceHubDraftsPage", () => {
  test("renders navigation, header, and draft nodes", () => {
    render(<ResourceHubDraftsPageHarness nodes={[createMockDraftNode()]} />);

    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(screen.getByText("Engineering Handbook")).toBeInTheDocument();
    expect(screen.getByText("Your Drafts")).toBeInTheDocument();
    expect(screen.getByText("Draft Interview Guide")).toBeInTheDocument();
  });

  test("renders the page shell when there are no drafts", () => {
    const { container } = render(<ResourceHubDraftsPageHarness nodes={[]} />);

    expect(screen.getByText("Your Drafts")).toBeInTheDocument();
    expect(container.querySelector('[data-test-id="node-0"]')).not.toBeInTheDocument();
  });
});
