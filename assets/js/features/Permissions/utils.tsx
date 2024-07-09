import { PermissionLevels, PermissionOptions } from ".";
import { Permissions } from "./PermissionsContext";


export function calculatePrivacyLevel(permissions: Permissions) {
  if (permissions.public !== PermissionLevels.NO_ACCESS) return PermissionOptions.PUBLIC;

  if(permissions.company !== PermissionLevels.NO_ACCESS) return PermissionOptions.INTERNAL;

  if(permissions.space !== PermissionLevels.NO_ACCESS) return PermissionOptions.CONFIDENTIAL;

  return PermissionOptions.SECRET;
}