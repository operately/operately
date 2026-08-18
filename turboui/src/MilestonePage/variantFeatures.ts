export type Variant = "project" | "project-template";

export interface VariantFeatures {
  showStatus: boolean;
  showCalendarDueDate: boolean;
  showRelativeDueDate: boolean;
  showActivity: boolean;
  showSubscriptions: boolean;
  showCreatedBy: boolean;
  showCompletedOn: boolean;
  showKanbanLink: boolean;
  showInsertedAt: boolean;
  showProjectTasks: boolean;
  showTemplateTasks: boolean;
  sidebarTestId: "sidebar" | "template-milestone-sidebar";
  mobileMetaTestId: "milestone-mobile-meta" | "template-milestone-mobile-meta";
}

export function variantFeatures(variant: Variant): VariantFeatures {
  switch (variant) {
    case "project":
      return {
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
      };
    case "project-template":
      return {
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
      };
  }
}
