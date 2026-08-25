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
      showProjectTasks: true,
      showTemplateTasks: false,
      sidebarTestId: "sidebar",
      mobileMetaTestId: "milestone-mobile-meta",
    });
  });

  it("shows relative due date and hides status, activity, subscriptions, and created date for template milestones", () => {
    expect(variantFeatures("project-template")).toEqual({
      showStatus: false,
      showCalendarDueDate: false,
      showRelativeDueDate: true,
      showActivity: false,
      showSubscriptions: false,
      showCreatedBy: false,
      showCompletedOn: false,
      showKanbanLink: false,
      showProjectTasks: false,
      showTemplateTasks: true,
      sidebarTestId: "template-milestone-sidebar",
      mobileMetaTestId: "template-milestone-mobile-meta",
    });
  });
});
