export { SpacePermissionSelector, ResourcePermissionSelector } from "./PermissionSelector";

export enum PermissionLevels {
  FULL_ACCESS = 100,
  EDIT_ACCESS = 70,
  COMMENT_ACCESS = 40,
  VIEW_ACCESS = 10,
  NO_ACCESS = 0,
}

export enum PermissionOptions {
  PUBLIC = "public",
  INTERNAL = "internal",
  CONFIDENTIAL = "confidential",
  SECRET = "secret",
}

export interface PermissionOption {
  value: PermissionLevels;
  label: string;
}

export const VIEW_ACCESS = {
  value: PermissionLevels.VIEW_ACCESS,
  label: "View Access",
};

export const NO_ACCESS = {
  value: PermissionLevels.NO_ACCESS,
  label: "No Access",
};

export const PERMISSIONS_LIST = [
  { value: PermissionLevels.FULL_ACCESS, label: "Full Access" },
  { value: PermissionLevels.EDIT_ACCESS, label: "Edit Access" },
  { value: PermissionLevels.COMMENT_ACCESS, label: "Comment Access" },
  VIEW_ACCESS,
];

export const PUBLIC_PERMISSIONS_LIST = [VIEW_ACCESS];
