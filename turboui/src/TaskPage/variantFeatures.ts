export type Variant = "template" | "space-task" | "project-task";

export interface VariantFeatures {
  showMilestone: boolean;
  showActivity: boolean;
  showSubscriptions: boolean;
  showReminders: boolean;
  showCompleteCheckbox: boolean;
  showRelativeDueDate: boolean;
  showMoveAndArchive: boolean;
}

export function variantFeatures(variant: Variant): VariantFeatures {
  switch (variant) {
    case "template":
      return {
        showMilestone: true,
        showActivity: false,
        showSubscriptions: false,
        showReminders: false,
        showCompleteCheckbox: false,
        showRelativeDueDate: true,
        showMoveAndArchive: false,
      };
    case "space-task":
      return {
        showMilestone: false,
        showActivity: true,
        showSubscriptions: true,
        showReminders: true,
        showCompleteCheckbox: true,
        showRelativeDueDate: false,
        showMoveAndArchive: true,
      };
    case "project-task":
      return {
        showMilestone: true,
        showActivity: true,
        showSubscriptions: true,
        showReminders: true,
        showCompleteCheckbox: true,
        showRelativeDueDate: false,
        showMoveAndArchive: true,
      };
  }
}
