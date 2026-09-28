import * as React from "react";
import { configure, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

configure({ testIdAttribute: "data-test-id" });

jest.mock("../icons", () => {
  const HiddenIcon = () => <span aria-hidden="true" />;

  return {
    IconChevronDown: HiddenIcon,
    IconChevronRight: HiddenIcon,
    IconCheck: HiddenIcon,
    IconCircleArrowRight: HiddenIcon,
    IconCircleCheck: HiddenIcon,
    IconCircleXFilled: HiddenIcon,
    IconClipboardText: HiddenIcon,
    IconDots: HiddenIcon,
    IconFile: HiddenIcon,
    IconFileExport: HiddenIcon,
    IconFolderFilled: HiddenIcon,
    IconGoal: HiddenIcon,
    IconInfoCircle: HiddenIcon,
    IconInfoCircleFilled: HiddenIcon,
    IconLink: HiddenIcon,
    IconLogs: HiddenIcon,
    IconMessage: HiddenIcon,
    IconMessages: HiddenIcon,
    IconRotateDot: HiddenIcon,
    IconSearch: HiddenIcon,
    IconSlash: HiddenIcon,
    IconTrash: HiddenIcon,
    IconUpload: HiddenIcon,
    IconUserCheck: HiddenIcon,
    IconUserStar: HiddenIcon,
    IconVideo: HiddenIcon,
    IconX: HiddenIcon,
  };
});

jest.mock("../CheckInCard", () => ({
  CheckInCard: ({ checkIn }: { checkIn: { id: string } }) => <div data-test-id={checkIn.id} />,
}));
jest.mock("../DiscussionCard", () => ({
  DiscussionCard: ({ discussion }: { discussion: { id: string } }) => <div data-test-id={discussion.id} />,
}));
jest.mock("../MiniWorkMap", () => ({
  MiniWorkMap: ({ items }: { items: { id: string }[] }) => (
    <div>
      {items.map((item) => (
        <div key={item.id} data-test-id={item.id} />
      ))}
    </div>
  ),
}));

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
import { createMockRichTextHandlers } from "../utils/storybook/richEditor";
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
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";

function GoalPageHarness({
  includeDocsAndFiles = false,
  initialEntry = "/goals/goal-1",
  search,
  docsState,
  contentState,
}: {
  contentState?: Partial<GoalPage.Props>;
  includeDocsAndFiles?: boolean;
  initialEntry?: string;
  search?: NonNullable<NonNullable<GoalPage.Props["docsAndFiles"]>["search"]>["search"];
  docsState?: Pick<
    GoalPage.Props,
    "docsAndFilesAvailable" | "docsAndFilesLoading" | "docsAndFilesError" | "onRetryDocsAndFiles"
  >;
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
        },
        newFileModals: sharedProps.newFileModals,
        addFileWidgetProps: sharedProps.addFileWidgetProps,
        nodesListProps: sharedProps.nodesListProps,
        addFolderModalProps: sharedProps.addFolderModalProps,
        search: search
          ? {
              search,
              placeholder: "Search documents and files…",
              testId: "resource-hub-search",
            }
          : undefined,
      }
    : undefined;

  return (
    <MemoryRouter initialEntries={[initialEntry]}>
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
        childrenCount={{
          checkInsCount: 0,
          discussionsCount: 0,
          docsAndFilesCount: includeDocsAndFiles ? 1 : 0,
        }}
        docsAndFiles={docsAndFiles}
        {...docsState}
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
        richTextHandlers={createMockRichTextHandlers()}
        formattedTimePreferences={defaultFormattedTimePreferences}
        {...contentState}
      />
    </MemoryRouter>
  );
}

describe("GoalPage", () => {
  test("keeps the goal overview accessible when docs fail", () => {
    render(<GoalPageHarness docsState={{ docsAndFilesAvailable: true, docsAndFilesError: true }} />);
    expect(screen.getByText("Goal description")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Docs & Files/ })).toBeInTheDocument();
  });

  test("shows docs errors and retry without falling back to overview", () => {
    const retry = jest.fn();
    render(
      <GoalPageHarness
        initialEntry="/goals/goal-1?tab=docs-and-files"
        docsState={{ docsAndFilesAvailable: true, docsAndFilesError: true, onRetryDocsAndFiles: retry }}
      />,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.queryByText("Goal description")).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId("retry-docs-and-files"));
    expect(retry).toHaveBeenCalledTimes(1);
  });

  test("shows loading feedback while retrying docs", () => {
    render(
      <GoalPageHarness
        initialEntry="/goals/goal-1?tab=docs-and-files"
        docsState={{ docsAndFilesAvailable: true, docsAndFilesLoading: true }}
      />,
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  test("hides the docs and files tab when goal docs are unavailable", () => {
    render(<GoalPageHarness />);

    expect(screen.queryByRole("link", { name: /Docs & Files/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Quarterly Plan")).not.toBeInTheDocument();
  });

  test("shows the docs and files tab and overview preview when goal docs are available", () => {
    render(<GoalPageHarness includeDocsAndFiles />);

    expect(screen.getByRole("link", { name: "Docs & Files 1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Show 1 more" })).toHaveAttribute(
      "href",
      "/goals/goal-1?tab=docs-and-files",
    );
    expect(screen.getByText("Quarterly Plan")).toBeInTheDocument();
  });

  test("renders the shared resource hub content in the docs and files tab", () => {
    render(<GoalPageHarness includeDocsAndFiles initialEntry="/goals/goal-1?tab=docs-and-files" />);

    expect(screen.getByText("Your drafts (1)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort by Name" })).toBeInTheDocument();
    expect(screen.getByText("Quarterly Plan")).toBeInTheDocument();
    expect(screen.getByText("Roadmap Screenshot")).toBeInTheDocument();
  });

  test("renders resource hub search immediately before sorting in the docs and files tab", () => {
    render(
      <GoalPageHarness includeDocsAndFiles initialEntry="/goals/goal-1?tab=docs-and-files" search={async () => []} />,
    );

    const searchInput = screen.getByRole("searchbox", { name: "Search documents and files…" });
    const sortControl = screen.getByRole("button", { name: "Sort by Name" });

    expect(searchInput.compareDocumentPosition(sortControl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sortControl).toBeEnabled();

    fireEvent.change(searchInput, { target: { value: "plan" } });

    expect(screen.getByRole("button", { name: "Sort by Name" })).toBeDisabled();
  });

  test("falls back to the overview when the docs and files tab is requested without hub data", () => {
    render(<GoalPageHarness initialEntry="/goals/goal-1?tab=docs-and-files" />);

    expect(screen.getByText("Goal description")).toBeInTheDocument();
    expect(screen.queryByText("Your drafts (1)")).not.toBeInTheDocument();
  });
});

const contentSections = [
  { tab: "check-ins", name: "check-ins", loading: "checkInsLoading", error: "checkInsError", retry: "onRetryCheckIns" },
  {
    tab: "discussions",
    name: "discussions",
    loading: "discussionsLoading",
    error: "discussionsError",
    retry: "onRetryDiscussions",
  },
  {
    tab: "overview",
    name: "related-work",
    loading: "relatedWorkLoading",
    error: "relatedWorkError",
    retry: "onRetryRelatedWork",
  },
] as const;

it.each(contentSections)("shows $name loading for read-only users", ({ tab, name, loading }) => {
  const { container } = render(
    <GoalPageHarness
      initialEntry={`/goals/goal-1?tab=${tab}`}
      contentState={{ [loading]: true, permissions: generateGoalPermissions(false) }}
    />,
  );
  expect(container.querySelector(`[data-test-id="${name}-skeleton"]`)).toBeInTheDocument();
  expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
});

it.each(contentSections)("shows $name failure and retries for read-only users", ({ tab, name, error, retry }) => {
  const onRetry = jest.fn();
  const { container, rerender } = render(
    <GoalPageHarness
      initialEntry={`/goals/goal-1?tab=${tab}`}
      contentState={{ [error]: true, [retry]: onRetry, permissions: generateGoalPermissions(false) }}
    />,
  );
  expect(container.querySelector(`[data-test-id="${name}-error"]`)).toBeInTheDocument();
  fireEvent.click(screen.getByTestId(`retry-${name}`));
  expect(onRetry).toHaveBeenCalledTimes(1);
  rerender(
    <GoalPageHarness
      initialEntry={`/goals/goal-1?tab=${tab}`}
      contentState={{ [error]: false, permissions: generateGoalPermissions(false) }}
    />,
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(container.querySelector(`[data-test-id="${name}-skeleton"]`)).not.toBeInTheDocument();
});

it.each(["active", "closed"] as const)(
  "does not show a discussion empty state during %s loading or failure",
  (state) => {
    const { container, rerender } = render(
      <GoalPageHarness
        initialEntry="/goals/goal-1?tab=discussions"
        contentState={{ state, discussionsLoading: true }}
      />,
    );
    expect(container.querySelector('[data-test-id="discussions-empty-state"]')).not.toBeInTheDocument();
    rerender(
      <GoalPageHarness initialEntry="/goals/goal-1?tab=discussions" contentState={{ state, discussionsError: true }} />,
    );
    expect(container.querySelector('[data-test-id="discussions-empty-state"]')).not.toBeInTheDocument();
    rerender(<GoalPageHarness initialEntry="/goals/goal-1?tab=discussions" contentState={{ state }} />);
    expect(container.querySelector('[data-test-id="discussions-empty-state"]')).toBeInTheDocument();
  },
);

const cachedContent: Partial<GoalPage.Props> = {
  checkIns: [
    {
      id: "cached-check-in",
      author: null,
      date: new Date("2026-09-14"),
      content: "{}",
      link: "#",
      commentCount: 0,
      status: "on_track",
    },
  ],
  discussions: [
    {
      id: "cached-discussion",
      title: "Discussion",
      author: { id: "person1", fullName: "Test Person", avatarUrl: null, title: "", profileLink: "#" },
      date: new Date("2026-09-14"),
      link: "#",
      content: "{}",
      commentCount: 0,
    },
  ],
  relatedWorkItems: [
    {
      id: "cached-child",
      name: "Child goal",
      type: "goal",
      status: "on_track",
      state: "active",
      itemPath: "#",
      children: [],
      assignees: [],
    },
  ],
};

it.each([
  { tab: "check-ins", error: "checkInsError", item: "cached-check-in" },
  { tab: "discussions", error: "discussionsError", item: "cached-discussion" },
  { tab: "overview", error: "relatedWorkError", item: "cached-child" },
])("keeps cached $tab content after a refresh failure", ({ tab, error, item }) => {
  const { container } = render(
    <GoalPageHarness initialEntry={`/goals/goal-1?tab=${tab}`} contentState={{ ...cachedContent, [error]: true }} />,
  );
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(container.querySelector(`[data-test-id="${item}"]`)).toBeInTheDocument();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});
