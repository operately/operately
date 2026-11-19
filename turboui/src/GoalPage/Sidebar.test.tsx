import { i18n, setupTestCatalog } from "../../test/i18n";
import React from "react";
import { configure, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import type { GoalPage } from ".";
import { Sidebar } from "./Sidebar";
import { defaultFormattedTimePreferences } from "../utils/storybook/formattedTime";
import { generateGoalPermissions } from "../utils/storybook/permissions";
import { createMockRichTextHandlers } from "../utils/storybook/richEditor";

configure({ testIdAttribute: "data-test-id" });
setupTestCatalog();

function sidebarProps(): GoalPage.State {
  return {
    preview: false,
    companyWorkMapLink: "/work-map",
    closeLink: "#",
    reopenLink: "#",
    newCheckInLink: "#",
    newDiscussionLink: "#",
    manageAccessLink: "/goals/goal-1/access",
    goalName: "Launch AI Platform",
    setGoalName: jest.fn(),
    parentGoal: null,
    setParentGoal: jest.fn(),
    parentGoalSearch: async () => [],
    champion: null,
    setChampion: jest.fn(),
    reviewer: null,
    setReviewer: jest.fn(),
    dueDate: null,
    setDueDate: jest.fn(),
    startDate: null,
    setStartDate: jest.fn(),
    contributors: [],
    targets: [],
    checklistItems: [],
    relatedWorkItems: [],
    checkIns: [],
    discussions: [],
    childrenCount: { checkInsCount: 0, discussionsCount: 0, docsAndFilesCount: 0 },
    status: "on_track",
    state: "active",
    closedAt: null,
    retrospective: null,
    permissions: generateGoalPermissions(true),
    accessLevels: { company: "view", space: "edit" },
    setAccessLevels: jest.fn(),
    neglectedGoal: false,
    championSearch: { people: [], onSearch: async () => {} },
    reviewerSearch: { people: [], onSearch: async () => {} },
    description: null,
    onDescriptionChange: async () => true,
    addTarget: async () => ({ success: true, id: "target-1" }),
    deleteTarget: async () => true,
    updateTarget: async () => true,
    updateTargetValue: async () => true,
    updateTargetIndex: async () => true,
    deleteGoal: async () => {},
    activityFeed: null,
    richTextHandlers: createMockRichTextHandlers(),
    formattedTimePreferences: defaultFormattedTimePreferences,
    isDeleteModalOpen: false,
    openDeleteModal: jest.fn(),
    closeDeleteModal: jest.fn(),
    isMoveModalOpen: false,
    openMoveModal: jest.fn(),
    closeMoveModal: jest.fn(),
  };
}

it.each([
  ["en", "Parent goal", "Start date", "Due date"],
  ["pt-BR", "Objetivo superior", "Data de início", "Data de conclusão"],
])(
  "renders goal sidebar field labels with consistent capitalization in %s",
  async (language, parentGoal, startDate, dueDate) => {
    await i18n.changeLanguage(language);
    render(
      <MemoryRouter>
        <Sidebar {...sidebarProps()} />
      </MemoryRouter>,
    );

    expect(screen.getByText(parentGoal, { exact: true })).toBeInTheDocument();
    expect(screen.getByText(startDate, { exact: true })).toBeInTheDocument();
    expect(screen.getByText(dueDate, { exact: true })).toBeInTheDocument();
  },
);

it.each([
  ["en", "Access"],
  ["pt-BR", "Acesso"],
])("labels the non-preview goal sidebar access section in %s", async (language, title) => {
  await i18n.changeLanguage(language);
  render(
    <MemoryRouter>
      <Sidebar {...sidebarProps()} />
    </MemoryRouter>,
  );

  expect(screen.getByText(title, { exact: true })).toBeInTheDocument();
  expect(screen.getByTestId("goal-privacy-field")).toBeEnabled();
  expect(screen.getByTestId("manage-goal-access-button")).toHaveAttribute("href", "/goals/goal-1/access");
});
