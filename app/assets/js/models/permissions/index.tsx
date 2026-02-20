export type { AccessOptions } from "@/api";
export { useGrantResourceAccess } from "@/api";

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

