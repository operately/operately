import * as React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

jest.mock("../icons", () => {
  const HiddenIcon = () => <span aria-hidden="true" />;

  return {
    IconChevronDown: HiddenIcon,
    IconChevronRight: HiddenIcon,
    IconCheck: HiddenIcon,
    IconCircleArrowRight: HiddenIcon,
    IconCircleCheck: HiddenIcon,
    IconClipboardText: HiddenIcon,
    IconDots: HiddenIcon,
    IconFile: HiddenIcon,
    IconFileExport: HiddenIcon,
    IconFolderFilled: HiddenIcon,
    IconGoal: HiddenIcon,
    IconInfoCircle: HiddenIcon,
    IconLink: HiddenIcon,
    IconLogs: HiddenIcon,
    IconMessage: HiddenIcon,
    IconMessages: HiddenIcon,
    IconRotateDot: HiddenIcon,
    IconSlash: HiddenIcon,
    IconTrash: HiddenIcon,
    IconUpload: HiddenIcon,
    IconUserCheck: HiddenIcon,
    IconUserStar: HiddenIcon,
    IconVideo: HiddenIcon,
    IconX: HiddenIcon,
  };
});

jest.mock("./Checklists", () => ({
  Checklists: () => <div>Checklists</div>,
}));

jest.mock("./Targets", () => ({
  Targets: () => <div>Targets</div>,
}));

jest.mock("./Sidebar", () => ({
  Sidebar: () => <div>Sidebar</div>,
}));

jest.mock("./PageHeader", () => ({
  PageHeader: () => <div>Page Header</div>,
}));

jest.mock("./DeleteModal", () => ({
  DeleteModal: () => null,
}));

jest.mock("../ProjectPageLayout/StatusBanner", () => ({
  StatusBanner: () => null,
}));

import { GoalPage } from "./index";
import { asRichText } from "../utils/storybook/richContent";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { generateGoalPermissions } from "../utils/storybook/permissions";
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

function GoalPageHarness({
  includeDocsAndFiles = false,
  initialEntry = "/goals/goal-1",
}: {
  includeDocsAndFiles?: boolean;
  initialEntry?: string;
}) {
  const permissions = generateGoalPermissions(true);
  const [resourceHub] = React.useState(() =>
    createMockResourceHub({
      id: "hub-1",
      name: "Documents & Files",
      goal: { id: "goal-1", name: "Launch AI Platform" } as never,
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
    ],
    [resourceHub],
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
        tabPath: "/goals/goal-1?tab=docs-and-files",
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
      <GoalPage
        companyWorkMapLink="/work-map?tab=goals"
        closeLink="#"
        reopenLink="#"
        newCheckInLink="#"
        newDiscussionLink="#"
        goalName="Launch AI Platform"
        setGoalName={() => undefined}
        parentGoal={null}
        setParentGoal={() => undefined}
        parentGoalSearch={async () => []}
        champion={null}
        setChampion={() => undefined}
        reviewer={null}
        setReviewer={() => undefined}
        dueDate={null}
        setDueDate={() => undefined}
        startDate={null}
        setStartDate={() => undefined}
        contributors={[]}
        targets={[]}
        checklistItems={[]}
        relatedWorkItems={[]}
        checkIns={[]}
        discussions={[]}
        docsAndFiles={docsAndFiles}
        status="on_track"
        state="active"
        closedAt={null}
        retrospective={null}
        permissions={permissions}
        accessLevels={{ company: "view", space: "view" }}
        setAccessLevels={() => undefined}
        neglectedGoal={false}
        championSearch={{} as any}
        reviewerSearch={{} as any}
        description={asRichText("A concise goal summary.")}
        onDescriptionChange={async () => true}
        addTarget={async () => ({ success: true, id: "target-1" })}
        deleteTarget={async () => true}
        updateTarget={async () => true}
        updateTargetValue={async () => true}
        updateTargetIndex={async () => true}
        deleteGoal={async () => undefined}
        activityFeed={<div>Activity feed</div>}
        richTextHandlers={createMockRichEditorHandlers()}
      />
    </MemoryRouter>
  );
}

describe("GoalPage", () => {
  test("hides the docs and files tab when goal docs are unavailable", () => {
    render(<GoalPageHarness />);

    expect(screen.queryByRole("link", { name: "Docs & Files" })).not.toBeInTheDocument();
    expect(screen.queryByText("Quarterly Plan")).not.toBeInTheDocument();
  });

  test("shows the docs and files tab and overview preview when goal docs are available", () => {
    render(<GoalPageHarness includeDocsAndFiles />);

    expect(screen.getByRole("link", { name: "Docs & Files" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Show 1 more" })).toHaveAttribute("href", "/goals/goal-1?tab=docs-and-files");
    expect(screen.getByText("Quarterly Plan")).toBeInTheDocument();
  });

  test("renders the shared resource hub content in the docs and files tab", () => {
    render(<GoalPageHarness includeDocsAndFiles initialEntry="/goals/goal-1?tab=docs-and-files" />);

    expect(screen.getByText("Continue writing your draft document...")).toBeInTheDocument();
    expect(screen.getByText("6 items")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort by Name" })).toBeInTheDocument();
    expect(screen.getByText("Quarterly Plan")).toBeInTheDocument();
    expect(screen.getByText("Roadmap Screenshot")).toBeInTheDocument();
  });

  test("falls back to the overview when the docs and files tab is requested without hub data", () => {
    render(<GoalPageHarness initialEntry="/goals/goal-1?tab=docs-and-files" />);

    expect(screen.getByText("Goal description")).toBeInTheDocument();
    expect(screen.queryByText("Continue writing your draft document...")).not.toBeInTheDocument();
  });
});
