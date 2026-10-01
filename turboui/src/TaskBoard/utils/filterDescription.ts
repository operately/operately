import i18n from "../../i18n";
import type { FilterCondition } from "../types";

/** Filter labels are presentation only; type, operator, and values remain unchanged. */
export function filterDescription(filter: Pick<FilterCondition, "type" | "operator" | "value">): string {
  const { type, operator, value } = filter;
  switch (type) {
    case "status": {
      const status = value?.label || value?.value || i18n.t("Unknown status");
      return operator === "is_not"
        ? i18n.t("Status is not {{status}}", { status })
        : i18n.t("Status is {{status}}", { status });
    }
    case "assignee":
      return operator === "is_not"
        ? i18n.t("Assignee is not {{name}}", { name: value?.fullName ?? "" })
        : i18n.t("Assignee is {{name}}", { name: value?.fullName ?? "" });
    case "creator":
      return operator === "is_not"
        ? i18n.t("Creator is not {{name}}", { name: value?.fullName ?? "" })
        : i18n.t("Creator is {{name}}", { name: value?.fullName ?? "" });
    case "milestone":
      return operator === "is_not"
        ? i18n.t("Milestone is not {{name}}", { name: value?.name ?? "" })
        : i18n.t("Milestone is {{name}}", { name: value?.name ?? "" });
    case "content":
      return operator === "does_not_contain"
        ? i18n.t('Content does not contain "{{query}}"', { query: value ?? "" })
        : i18n.t('Content contains "{{query}}"', { query: value ?? "" });
    case "due_date":
      if (operator === "before") return i18n.t("Due date before");
      if (operator === "after") return i18n.t("Due date after");
      return i18n.t("Due date between");
    case "created_date":
      if (operator === "before") return i18n.t("Created date before");
      if (operator === "after") return i18n.t("Created date after");
      return i18n.t("Created date between");
    case "updated_date":
      if (operator === "before") return i18n.t("Updated date before");
      if (operator === "after") return i18n.t("Updated date after");
      return i18n.t("Updated date between");
    case "started_date":
      if (operator === "before") return i18n.t("Started date before");
      if (operator === "after") return i18n.t("Started date after");
      return i18n.t("Started date between");
    case "completed_date":
      if (operator === "before") return i18n.t("Completed date before");
      if (operator === "after") return i18n.t("Completed date after");
      return i18n.t("Completed date between");
  }
}
