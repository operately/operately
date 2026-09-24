import i18n from "../i18n";
import type { TFunction } from "i18next";
import type { SearchResultType } from "../ApiTypes";
import type { RefineFilterOption } from "./RefineControls";

export function searchTypeFilterOptions(
  t: TFunction = i18n.t.bind(i18n),
): Array<RefineFilterOption & { id: SearchResultType }> {
  return [
    { id: "project", label: t("Projects") },
    { id: "goal", label: t("Goals") },
    { id: "milestone", label: t("Milestones") },
    { id: "task", label: t("Tasks") },
    { id: "person", label: t("People") },
    { id: "discussion", label: t("Discussions") },
    { id: "project_check_in", label: t("Project check-ins") },
    { id: "goal_check_in", label: t("Goal check-ins") },
    { id: "project_retrospective", label: t("Project retrospectives") },
    { id: "resource_hub_document", label: t("Documents") },
    { id: "resource_hub_folder", label: t("Folders") },
    { id: "resource_hub_file", label: t("Files") },
    { id: "resource_hub_link", label: t("Links") },
  ];
}

export function searchTimeFilterOptions(t: TFunction = i18n.t.bind(i18n)): RefineFilterOption[] {
  return [
    { id: "last_7_days", label: t("Last 7 days") },
    { id: "last_30_days", label: t("Last 30 days") },
    { id: "last_90_days", label: t("Last 90 days") },
    { id: "last_12_months", label: t("Last 12 months") },
  ];
}
