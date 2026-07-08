import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

jest.mock("@atlaskit/pragmatic-drag-and-drop-react-drop-indicator/box", () => ({
  DropIndicator: () => null,
}));

jest.mock("../utils/PragmaticDragAndDrop", () => ({
  projectItemsWithPlaceholder: ({ items }: { items: unknown[] }) => ({ items, placeholderIndex: null }),
  SubtleDropPlaceholder: () => null,
  useBoardDnD: () => ({
    draggedItemId: null,
    destination: null,
    draggedItemDimensions: null,
  }),
  useSortableItem: () => ({ ref: () => undefined, isDragging: false }),
}));

jest.mock("./TasksSection", () => ({
  TasksSection: () => <div>Tasks section</div>,
}));

jest.mock("./OverviewSidebar", () => ({
  OverviewSidebar: () => <div>Overview sidebar</div>,
}));

jest.mock("../icons", () => {
  const HiddenIcon = () => <span aria-hidden="true" />;

  return {
    IconAlignJustified: HiddenIcon,
    IconCheck: HiddenIcon,
    IconChartColumn: HiddenIcon,
    IconChevronDown: HiddenIcon,
    IconChevronRight: HiddenIcon,
    IconCircleArrowRight: HiddenIcon,
    IconCircleCheck: HiddenIcon,
    IconClipboardText: HiddenIcon,
    IconCopy: HiddenIcon,
    IconDots: HiddenIcon,
    IconEdit: HiddenIcon,
    IconFile: HiddenIcon,
    IconFileExport: HiddenIcon,
    IconFlag: HiddenIcon,
    IconFolderFilled: HiddenIcon,
    IconInfoCircle: HiddenIcon,
    IconLink: HiddenIcon,
    IconListCheck: HiddenIcon,
    IconLogs: HiddenIcon,
    IconMessage: HiddenIcon,
    IconMessages: HiddenIcon,
    IconPlayerPause: HiddenIcon,
    IconProject: HiddenIcon,
    IconRotateDot: HiddenIcon,
    IconSlash: HiddenIcon,
    IconTrash: HiddenIcon,
    IconUpload: HiddenIcon,
    IconVideo: HiddenIcon,
    IconX: HiddenIcon,
  };
});

import { PrivacyField } from "../PrivacyField";
import { ProjectPage } from "./index";

const defaultProjectAccessLevels: PrivacyField.AccessLevels = {
  company: "view",
  space: "view",
};
import { asRichText } from "../utils/storybook/richContent";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";
import { useMockSubscriptions } from "../utils/storybook/subscriptions";
import {
  createMockDocumentNode,
  createMockDraftNode,
  createMockFileNode,
  createMockFolder,
  createMockFolderNode,
  createMockPermissions,
  createMockResourceHub,
  useMockSharedListPageProps,
} from "../ResourceHubPage/mockData";

function ProjectPageHarness({
  includeDocsAndFiles = false,
  includeQuicktimeFile = false,
  initialEntry = "/projects/project-1",
}: {
  includeDocsAndFiles?: boolean;
  includeQuicktimeFile?: boolean;
  initialEntry?: string;
}) {
  const subscriptions = useMockSubscriptions({ entityType: "project" });
  const [resourceHub] = React.useState(() =>
    createMockResourceHub({
      id: "hub-1",
      name: "Documents & Files",
      project: { id: "project-1", name: "Apollo" } as never,
      permissions: createMockPermissions(),
    }),
  );
  const nodes = React.useMemo(
    () => [
      createMockDocumentNode({
        id: "node-document-quarterly-plan",
        name: "Quarterly Plan",
        updatedAt: "2026-06-13T12:00:00Z",
        document: {
          id: "document-quarterly-plan",
          resourceHubId: resourceHub.id,
          parentFolderId: undefined,
          commentsCount: 3,
        },
      }),
      createMockFileNode({
        id: "node-file-roadmap-screenshot",
        name: "Roadmap Screenshot",
        updatedAt: "2026-06-12T12:00:00Z",
        file: {
          id: "file-roadmap-screenshot",
          resourceHubId: resourceHub.id,
          parentFolderId: undefined,
        },
      }),
      createMockFolderNode({
        name: "Research",
        updatedAt: "2026-06-11T12:00:00Z",
        folder: createMockFolder({
          id: "folder-1",
          name: "Research",
          resourceHubId: resourceHub.id,
          resourceHub,
        }),
      }),
      createMockDocumentNode({
        id: "node-document-launch-faq",
        name: "Launch FAQ",
        updatedAt: "2026-06-10T12:00:00Z",
        document: {
          id: "document-launch-faq",
          resourceHubId: resourceHub.id,
          parentFolderId: undefined,
        },
      }),
      createMockFileNode({
        id: "node-file-support-macros",
        name: "Support macros",
        updatedAt: "2026-06-09T12:00:00Z",
        file: {
          id: "file-support-macros",
          resourceHubId: resourceHub.id,
          parentFolderId: undefined,
          blob: {
            id: "blob-pdf-1",
            url: "/support-macros.pdf",
            contentType: "application/pdf",
          } as any,
        },
      }),
      createMockDocumentNode({
        id: "node-document-attribution-dashboard-notes",
        name: "Attribution dashboard notes",
        updatedAt: "2026-06-08T12:00:00Z",
        document: {
          id: "document-attribution-dashboard-notes",
          resourceHubId: resourceHub.id,
          parentFolderId: undefined,
          commentsCount: 1,
        },
      }),
      ...(includeQuicktimeFile
        ? [
            createMockFileNode({
              id: "node-file-demo-clip",
              name: "Demo Clip",
              updatedAt: "2026-06-07T12:00:00Z",
              file: {
                id: "file-demo-clip",
                resourceHubId: resourceHub.id,
                parentFolderId: undefined,
                blob: {
                  id: "blob-mov-1",
                  url: "/demo.mov",
                  contentType: "video/quicktime",
                } as any,
              },
            }),
          ]
        : []),
    ],
    [includeQuicktimeFile, resourceHub],
  );
  const sharedProps = useMockSharedListPageProps({
    parent: resourceHub,
    parentType: "resource_hub",
    nodes,
  });

  const docsAndFiles = includeDocsAndFiles
    ? {
        resourceHub,
        previewNodes: nodes,
        tabPath: "/projects/project-1?tab=docs-and-files",
        drafts: {
          nodes: [
            createMockDraftNode({
              document: { resourceHubId: resourceHub.id, parentFolderId: undefined },
            }),
          ],
          draftsPath: `/resource-hubs/${resourceHub.id}/drafts`,
          getDraftEditPath: (node) => `/resource-hubs/documents/${node.document?.id}/edit`,
        },
        newFileModals: sharedProps.newFileModals,
        addFileWidgetProps: sharedProps.addFileWidgetProps,
        nodesListProps: sharedProps.nodesListProps,
        addFolderModalProps: sharedProps.addFolderModalProps,
      }
    : undefined;

  return (
    <MemoryRouter initialEntries={[initialEntry]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ProjectPage
        homeLink="/"
        closeLink="#"
        reopenLink="#"
        pauseLink="#"
        project={{ id: "project-1", name: "Apollo" }}
        newCheckInLink="#"
        newDiscussionLink="#"
        childrenCount={{ tasksCount: 0, checkInsCount: 0, discussionsCount: 0 }}
        permissions={{ canView: true, canComment: false, canEdit: false, hasFullAccess: false }}
        champion={null}
        reviewer={null}
        parentGoal={null}
        setParentGoal={() => undefined}
        parentGoalSearch={async () => []}
        status="on_track"
        state="active"
        closedAt={null}
        accessLevels={defaultProjectAccessLevels}
        setAccessLevels={() => undefined}
        manageTeamLink="#"
        updateProjectName={async () => true}
        description={asRichText("A concise project summary.")}
        onDescriptionChange={async () => true}
        activityFeed={<div>Activity feed</div>}
        onProjectDelete={() => undefined}
        tasks={[]}
        milestones={[]}
        searchableMilestones={[]}
        kanbanState={{} as any}
        onTaskKanbanChange={() => undefined}
        onTaskCreate={() => undefined}
        onTaskNameChange={() => undefined}
        onTaskAssigneeChange={() => undefined}
        onTaskDueDateChange={() => undefined}
        onTaskStatusChange={() => undefined}
        onTaskDelete={() => undefined}
        onMilestoneCreate={() => undefined}
        onMilestoneUpdate={() => undefined}
        onMilestoneReorder={async () => undefined}
        onMilestoneSearch={async () => undefined}
        assigneePersonSearch={{} as any}
        statuses={[]}
        onSaveCustomStatuses={() => undefined}
        contributors={[]}
        checkIns={[]}
        discussions={[]}
        currentUser={null}
        richTextHandlers={createMockRichEditorHandlers()}
        onTaskDescriptionChange={async () => true}
        getTaskPageProps={() => ({}) as any}
        resources={[]}
        onResourceAdd={() => undefined}
        onResourceEdit={() => undefined}
        onResourceRemove={() => undefined}
        subscriptions={subscriptions}
        docsAndFiles={docsAndFiles}
        formattedTimePreferences={defaultFormattedTimePreferences}
      />
    </MemoryRouter>
  );
}

describe("ProjectPage", () => {
  test("hides the docs and files tab when project docs are unavailable", () => {
    render(<ProjectPageHarness />);

    expect(screen.queryByRole("link", { name: "Docs & Files" })).not.toBeInTheDocument();
    expect(screen.queryByText("Quarterly Plan")).not.toBeInTheDocument();
  });

  test("shows the docs and files tab and overview preview when project docs are available", () => {
    render(<ProjectPageHarness includeDocsAndFiles />);

    expect(screen.getByRole("link", { name: "Docs & Files" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Show 1 more" })).toHaveAttribute(
      "href",
      "/projects/project-1?tab=docs-and-files",
    );
    expect(screen.getByText("Quarterly Plan")).toBeInTheDocument();
  });

  test("renders the shared resource hub content in the docs and files tab", () => {
    render(<ProjectPageHarness includeDocsAndFiles initialEntry="/projects/project-1?tab=docs-and-files" />);

    expect(screen.getByText("Continue writing your draft document...")).toBeInTheDocument();
    expect(screen.getByText("6 items")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort by Name" })).toBeInTheDocument();
    expect(screen.getByText("Quarterly Plan")).toBeInTheDocument();
    expect(screen.getByText("Roadmap Screenshot")).toBeInTheDocument();
  });

  test("renders quicktime videos as MOV files in the docs and files tab", () => {
    render(
      <ProjectPageHarness
        includeDocsAndFiles
        includeQuicktimeFile
        initialEntry="/projects/project-1?tab=docs-and-files"
      />,
    );

    expect(screen.getByText("Demo Clip")).toBeInTheDocument();
    expect(screen.getByText("mov")).toBeInTheDocument();
  });

  test("falls back to the overview when the docs and files tab is requested without hub data", () => {
    render(<ProjectPageHarness initialEntry="/projects/project-1?tab=docs-and-files" />);

    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.queryByText("Continue writing your draft document...")).not.toBeInTheDocument();
  });
});
