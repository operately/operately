export { SpacePermissionSelector, ResourcePermissionSelector } from "./PermissionSelector"

export enum PermissionLevels {
  FULL_ACCESS=100,
  EDIT_ACCESS=70,
  COMMENT_ACCESS=40,
  VIEW_ACCESS=10,
  NO_ACCESS=0,
};

export interface PermissionOption {
  value: PermissionLevels,
  label: string,
}

export const VIEW_ACCESS = {
  value: PermissionLevels.VIEW_ACCESS,
  label: "Can View",
};

export const PERMISSIONS_LIST = [
  {value: PermissionLevels.FULL_ACCESS, label: "Has Full Access"},
  {value: PermissionLevels.EDIT_ACCESS, label: "Can Edit"},
  {value: PermissionLevels.COMMENT_ACCESS, label: "Can Comment"},
  VIEW_ACCESS,
]

export const PUBLIC_PERMISSIONS_LIST = [
  VIEW_ACCESS,
]