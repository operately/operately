export const enum PermissionLevels {
  FULL_ACCESS = 100,
  EDIT_ACCESS = 70,
  COMMENT_ACCESS = 40,
  VIEW_ACCESS = 10,
  NO_ACCESS = 0
};

export type PermissionLevel = 100 | 70 | 40 | 10 | 0;
