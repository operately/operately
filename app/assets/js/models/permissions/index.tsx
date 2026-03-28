import Api from "@/api";

export type { AccessOptions, AccessOptionsInt, AccessLevels } from "@/api";
export const useGrantResourceAccess = Api.companies.useGrantResourceAccess;

export const PERMISSIONS_LIST_COMPLETE = [
  { value: "full_access", label: "Full Access" },
  { value: "edit_access", label: "Edit Access" },
  { value: "comment_access", label: "Comment Access" },
  { value: "view_access", label: "View Access" },
];

export const PERMISSIONS_LIST = [
  { value: "edit_access", label: "Edit Access" },
  { value: "comment_access", label: "Comment Access" },
  { value: "view_access", label: "View Access" },
];

