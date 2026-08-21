import * as React from "react";
import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

jest.mock("../LastCheckIn", () => ({
  LastCheckIn: () => <div>Last check-in</div>,
}));

jest.mock("./CheckInOverdueCallout", () => ({
  CheckInOverdueCallout: () => null,
}));

jest.mock("../icons", () => {
  const HiddenIcon = () => <span aria-hidden="true" />;

  return new Proxy(
    {},
    {
      get: () => HiddenIcon,
    },
  );
});

import { OverviewSidebar } from "./OverviewSidebar";
import type { ProjectPage } from "./index";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { useMockSubscriptions } from "../utils/storybook/subscriptions";

function SidebarHarness({
  accessLevels,
  saveAsTemplate,
}: {
  accessLevels: ProjectPage.State["accessLevels"];
  saveAsTemplate?: ProjectPage.State["saveAsTemplate"];
}) {
  const subscriptions = useMockSubscriptions({ entityType: "project" });

  const props = {
    closeLink: "#",
    reopenLink: "#",
    pauseLink: "#",
    project: { id: "project-1", name: "Secret project" },
    newCheckInLink: "#",
    newDiscussionLink: "#",
    childrenCount: { tasksCount: 0, discussionsCount: 0, checkInsCount: 0, docsAndFilesCount: 0 },
    permissions: { canView: true, canComment: true, canEdit: true, hasFullAccess: true },
    champion: null,
    reviewer: null,
    parentGoal: null,
    setParentGoal: () => undefined,
    parentGoalSearch: async () => [],
    status: "on_track" as const,
    state: "active" as const,
    closedAt: null,
    manageTeamLink: "#",
    manageAccessLink: "#",
    accessLevels,
    setAccessLevels: () => undefined,
    updateProjectName: async () => true,
    description: "",
    onDescriptionChange: async () => true,
    activityFeed: <div />,
    onProjectDelete: () => undefined,
    tasks: [],
    tasksView: "list",
    onTasksViewChange: () => undefined,
    milestones: [],
    searchableMilestones: [],
    kanbanState: {} as ProjectPage.State["kanbanState"],
    onTaskKanbanChange: () => undefined,
    onTaskCreate: () => undefined,
    onTaskNameChange: () => undefined,
    onTaskAssigneeChange: () => undefined,
    onTaskDueDateChange: () => undefined,
    onTaskStatusChange: () => undefined,
    onTaskDelete: () => undefined,
    onMilestoneCreate: () => undefined,
    onMilestoneUpdate: () => undefined,
    onMilestoneReorder: async () => undefined,
    onMilestoneSearch: async () => undefined,
    assigneePersonSearch: {} as ProjectPage.State["assigneePersonSearch"],
    statuses: [],
    onSaveCustomStatuses: () => undefined,
    contributors: [],
    checkIns: [],
    discussions: [],
    richTextHandlers: createMockRichEditorHandlers(),
    onTaskDescriptionChange: async () => true,
    getTaskPageProps: () => ({}) as any,
    subscriptions,
    formattedTimePreferences: defaultFormattedTimePreferences,
    saveAsTemplate,
    homeLink: "/",
    isMoveModalOpen: false,
    openMoveModal: () => undefined,
    closeMoveModal: () => undefined,
    isDeleteModalOpen: false,
    openDeleteModal: () => undefined,
    closeDeleteModal: () => undefined,
  } satisfies ProjectPage.State;

  return (
    <MemoryRouter>
      <OverviewSidebar {...props} />
    </MemoryRouter>
  );
}

describe("OverviewSidebar privacy", () => {
  it("shows invite-only access in the privacy section", () => {
    const { container } = render(
      <SidebarHarness
        accessLevels={{
          company: "no_access",
          space: "no_access",
        }}
      />,
    );

    const privacyField = container.querySelector('[data-test-id="project-privacy-field"]');
    expect(privacyField).toHaveTextContent("Only assigned people have access");
  });
});

describe("OverviewSidebar save as template action", () => {
  const accessLevels = { company: "no_access", space: "no_access" } as ProjectPage.State["accessLevels"];
  const onSave = jest.fn().mockResolvedValue({ success: true });

  it("is absent without the optional contract", () => {
    const { queryByText } = render(<SidebarHarness accessLevels={accessLevels} />);
    expect(queryByText("Save as template")).not.toBeInTheDocument();
  });

  it.each([
    ["View", false],
    ["Comment", false],
    ["Edit", true],
    ["Full", true],
  ])("follows the %s access projection", (_level, canSave) => {
    const { queryByText } = render(
      <SidebarHarness accessLevels={accessLevels} saveAsTemplate={{ canSave, submissionEnabled: true, onSave }} />,
    );

    if (canSave) expect(queryByText("Save as template")).toBeInTheDocument();
    else expect(queryByText("Save as template")).not.toBeInTheDocument();
  });
});
