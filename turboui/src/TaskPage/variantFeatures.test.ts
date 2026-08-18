import { variantFeatures } from "./variantFeatures";

describe("TaskPage.variantFeatures", () => {
  it("shows relative due date and hides activity for template tasks", () => {
    expect(variantFeatures("template")).toEqual({
      showMilestone: true,
      showActivity: false,
      showSubscriptions: false,
      showReminders: false,
      showCompleteCheckbox: false,
      showRelativeDueDate: true,
      showMoveAndArchive: false,
    });
  });

  it("hides the milestone field for space tasks", () => {
    expect(variantFeatures("space-task")).toEqual({
      showMilestone: false,
      showActivity: true,
      showSubscriptions: true,
      showReminders: true,
      showCompleteCheckbox: true,
      showRelativeDueDate: false,
      showMoveAndArchive: true,
    });
  });

  it("shows the full project-task sidebar", () => {
    expect(variantFeatures("project-task")).toEqual({
      showMilestone: true,
      showActivity: true,
      showSubscriptions: true,
      showReminders: true,
      showCompleteCheckbox: true,
      showRelativeDueDate: false,
      showMoveAndArchive: true,
    });
  });
});
