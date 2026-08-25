import React from "react";
import { render, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { defaultFormattedTimePreferences } from "../../FormattedTime";
import { Sidebar } from "./Sidebar";
import type { MilestonePage } from "../types";

function getByDataTestId(testId: string) {
  const element = document.querySelector<HTMLElement>(`[data-test-id="${testId}"]`);
  if (!element) throw new Error(`Could not find element with data-test-id="${testId}"`);
  return element;
}

function templateState(): MilestonePage.TemplateState {
  return {
    variant: "project-template",
    template: { id: "template-1", name: "Launch template", archived: false },
    space: { id: "space-1", name: "Product", link: "/spaces/product" },
    projectTemplatesLink: "/spaces/product/project-templates",
    templateLink: "/spaces/product/project-templates/template-1",
    updateTemplateName: async () => true,
    permissions: { canEdit: true },
    tasksCount: 0,
    discussionsCount: 0,
    docsAndFilesCount: 0,
    milestoneId: "milestone-1",
    title: "Launch",
    onMilestoneTitleChange: async () => true,
    description: null,
    onDescriptionChange: async () => true,
    dueOffsetDays: 3,
    onDueOffsetDaysChange: () => undefined,
    tasks: [],
    statuses: [],
    milestones: [],
    personSearch: { people: [], onSearch: async () => undefined },
    richTextHandlers: {} as never,
    formattedTimePreferences: defaultFormattedTimePreferences,
    isTaskModalOpen: false,
    setIsTaskModalOpen: () => undefined,
    isDeleteModalOpen: false,
    openDeleteModal: () => undefined,
    closeDeleteModal: () => undefined,
  };
}

describe("MilestonePage Sidebar", () => {
  it("does not show a created date on template milestones", () => {
    render(
      <MemoryRouter>
        <Sidebar {...templateState()} />
      </MemoryRouter>,
    );

    const sidebar = getByDataTestId("template-milestone-sidebar");

    expect(document.querySelector('[data-test-id="template-milestone-due-offset"]')).toBeInTheDocument();
    expect(within(sidebar).queryByText("Created")).not.toBeInTheDocument();
  });
});
