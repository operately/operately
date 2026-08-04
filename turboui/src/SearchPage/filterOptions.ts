import type { SearchResultType } from "../ApiTypes";
import type { RefineFilterOption } from "./RefineControls";

export const SEARCH_TYPE_FILTER_OPTIONS: Array<RefineFilterOption & { id: SearchResultType }> = [
  { id: "project", label: "Projects" },
  { id: "goal", label: "Goals" },
  { id: "milestone", label: "Milestones" },
  { id: "task", label: "Tasks" },
  { id: "person", label: "People" },
  { id: "discussion", label: "Discussions" },
  { id: "project_check_in", label: "Project check-ins" },
  { id: "goal_check_in", label: "Goal check-ins" },
  { id: "project_retrospective", label: "Project retrospectives" },
  { id: "resource_hub_document", label: "Documents" },
  { id: "resource_hub_folder", label: "Folders" },
  { id: "resource_hub_file", label: "Files" },
  { id: "resource_hub_link", label: "Links" },
];

export const SEARCH_TIME_FILTER_OPTIONS: RefineFilterOption[] = [
  { id: "last_7_days", label: "Last 7 days" },
  { id: "last_30_days", label: "Last 30 days" },
  { id: "last_90_days", label: "Last 90 days" },
  { id: "last_12_months", label: "Last 12 months" },
];
