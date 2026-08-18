import { variantFeatures } from "./variantFeatures";

describe("MilestonePage.variantFeatures", () => {
  it("shows calendar due date, status, activity, and subscriptions for project milestones", () => {
    expect(variantFeatures("project")).toEqual({
      showStatus: true,
      showCalendarDueDate: true,
      showRelativeDueDate: false,
      showActivity: true,
      showSubscriptions: true,
      showCreatedBy: true,
      showCompletedOn: true,
      showKanbanLink: true,
      showInsertedAt: false,
      showProjectTasks: true,
      showTemplateTasks: false,
      sidebarTestId: "sidebar",
      mobileMetaTestId: "milestone-mobile-meta",
    });
  });

  it("shows relative due date and hides status, activity, and subscriptions for template milestones", () => {
    expect(variantFeatures("project-template")).toEqual({
      showStatus: false,
      showCalendarDueDate: false,
      showRelativeDueDate: true,
      showActivity: false,
      showSubscriptions: false,
      showCreatedBy: false,
      showCompletedOn: false,
      showKanbanLink: false,
      showInsertedAt: true,
      showProjectTasks: false,
      showTemplateTasks: true,
      sidebarTestId: "template-milestone-sidebar",
      mobileMetaTestId: "template-milestone-mobile-meta",
    });
  });
});
