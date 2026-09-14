import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

jest.mock("../icons", () => ({
  IconAlignJustified: () => <span>align-justified</span>,
  IconChartColumn: () => <span>chart-column</span>,
  IconX: () => <span>close</span>,
  IconCircleXFilled: () => <span>error</span>,
  IconDots: () => <span>menu-dots</span>,
  IconFolderFilled: () => <span>folder</span>,
  IconLink: () => <span>link</span>,
  IconLogs: () => <span>logs</span>,
  IconSlash: () => <span>slash</span>,
  IconVideo: () => <span>video</span>,
}));

import { defaultFormattedTimePreferences } from "../FormattedTime";
import { ResourceHubDraftsPage } from "./index";
import { createMockDraftNode, createMockResourceHub } from "../ResourceHubPage/mockData";

function ResourceHubDraftsPageHarness({
  nodes,
  onDelete,
}: {
  nodes: React.ComponentProps<typeof ResourceHubDraftsPage>["nodes"];
  onDelete?: (id: string) => Promise<void>;
}) {
  const [resourceHub] = React.useState(() => createMockResourceHub());

  return (
    <MemoryRouter>
      <ResourceHubDraftsPage
        onDelete={onDelete}
        title={["Drafts", resourceHub.name ?? "Resource Hub"]}
        navigation={[
          { to: `/spaces/${resourceHub.space?.id}`, label: resourceHub.space?.name ?? "Operations" },
          { to: `/resource-hubs/${resourceHub.id}`, label: resourceHub.name ?? "Resource Hub" },
        ]}
        resourceHubPath={`/resource-hubs/${resourceHub.id}`}
        formattedTimePreferences={defaultFormattedTimePreferences}
        nodes={nodes}
        getNodePath={(node) => `/resource-hubs/documents/${node.document?.id ?? node.id}/edit`}
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
    expect(screen.getByRole("link", { name: "Back to Docs & Files" })).toHaveAttribute("href", "/resource-hubs/hub-1");
  });
});

test("shows folder paths to distinguish drafts with the same title", () => {
  const first = createMockDraftNode({
    pathToNode: [{ __typename: "resource_hub_folder", id: "folder-a", name: "Research" }],
  });
  const second = createMockDraftNode({
    id: "node-2",
    document: { id: "document-2" },
    pathToNode: [{ __typename: "resource_hub_folder", id: "folder-b", name: "Planning" }],
  });
  const { container } = render(<ResourceHubDraftsPageHarness nodes={[first, second]} />);
  const locations = container.querySelectorAll('[data-test-id="draft-location"]');
  expect(Array.from(locations, (el) => el.textContent)).toEqual(["Docs & Files / Research", "Docs & Files / Planning"]);
  expect(container.querySelector('[data-test-id="node-0"] a')).toHaveAttribute(
    "href",
    `/resource-hubs/documents/${first.document?.id}/edit`,
  );
});

test.each([false, true])("confirms deletion and handles failure: %s", async (fails) => {
  const node = createMockDraftNode();
  const onDelete = jest.fn(async () => {
    if (fails) throw new Error("Unavailable");
  });
  const { container } = render(<ResourceHubDraftsPageHarness nodes={[node]} onDelete={onDelete} />);
  const trigger = container.querySelector(`[data-test-id="draft-menu-${node.document?.id}"]`);
  if (!trigger) throw new Error("Draft menu is missing");
  fireEvent.keyDown(trigger, { key: "Enter" });
  fireEvent.click(await screen.findByRole("menuitem"));
  expect(onDelete).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole("button", { name: "Delete" }));
  await waitFor(() => expect(onDelete).toHaveBeenCalledWith(node.document?.id));
  if (fails) {
    await waitFor(() => expect(container.querySelector('[data-test-id="draft-delete-error"]')).toBeInTheDocument());
    expect(container.querySelector('[data-test-id="node-0"]')).toBeInTheDocument();
  } else {
    await waitFor(() => expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument());
  }
});

test("does not offer deletion without permission", () => {
  const { container } = render(<ResourceHubDraftsPageHarness nodes={[createMockDraftNode()]} />);
  expect(container.querySelector('[data-test-id^="draft-menu-"]')).not.toBeInTheDocument();
});
