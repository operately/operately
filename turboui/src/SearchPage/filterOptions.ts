import i18n from "../i18n";
import type { SearchResultType } from "../ApiTypes";
import type { RefineFilterOption } from "./RefineControls";

export function searchTypeFilterOptions(): Array<RefineFilterOption & { id: SearchResultType }> {
  return [
    { id: "project", label: i18n.t("Projects") },
    { id: "goal", label: i18n.t("Goals") },
    { id: "milestone", label: i18n.t("Milestones") },
    { id: "task", label: i18n.t("Tasks") },
    { id: "person", label: i18n.t("People") },
    { id: "discussion", label: i18n.t("Discussions") },
    { id: "project_check_in", label: i18n.t("Project check-ins") },
    { id: "goal_check_in", label: i18n.t("Goal check-ins") },
    { id: "project_retrospective", label: i18n.t("Project retrospectives") },
    { id: "resource_hub_document", label: i18n.t("Documents") },
    { id: "resource_hub_folder", label: i18n.t("Folders") },
    { id: "resource_hub_file", label: i18n.t("Files") },
    { id: "resource_hub_link", label: i18n.t("Links") },
  ];
}

export function searchTimeFilterOptions(): RefineFilterOption[] {
  return [
    { id: "last_7_days", label: i18n.t("Last 7 days") },
    { id: "last_30_days", label: i18n.t("Last 30 days") },
    { id: "last_90_days", label: i18n.t("Last 90 days") },
    { id: "last_12_months", label: i18n.t("Last 12 months") },
  ];
}
