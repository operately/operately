import * as Api from "@/api";
import {
  COMMENT_ACCESS,
  EDIT_ACCESS,
  FULL_ACCESS,
  NO_ACCESS,
  PermissionLevels,
  VIEW_ACCESS,
} from "@/features/Permissions";

type Option = { value: PermissionLevels; label: string };

export type AccessLevels = {
  anonymous: PermissionLevels;
  anonymousOptions: Option[];
  companyMembers: PermissionLevels;
  companyMembersOptions: Option[];
  spaceMembers: PermissionLevels;
  spaceMembersOptions: Option[];
};

//
// Usage:
// To use the AccessLevels in a form, you can use the following code:
//
//   const form = Forms.useForm({
//     fields: {
//       access: initialAccessLevels(parentAccessLevel),
//     },
//     onChange: (values) => {
//       applyAccessLevelConstraints(values.access, parentAccessLevel);
//     }
//   });
//
// On every change the following constraints will be applied:
//
// 1. The annonynousMembers should not be greater than the parent access level's public access level.
// 2. The companyMembers should not be greater than the parent access level's company access level.
// 3. The access level for companyMembers should be greater than or equal to the access level for annonynousMembers.
// 4. The access level for spaceMembers should be greater than or equal to the access level for companyMembers.
//

//
// Available access levels
//
const ANNON = [VIEW_ACCESS, NO_ACCESS];
const COMPANY = [FULL_ACCESS, EDIT_ACCESS, COMMENT_ACCESS, VIEW_ACCESS, NO_ACCESS];
const SPACE = [FULL_ACCESS, EDIT_ACCESS, COMMENT_ACCESS, VIEW_ACCESS, NO_ACCESS];

export function initialAccessLevels(current: Api.AccessLevels | null, parent: Api.AccessLevels): AccessLevels {
  let annonymous: PermissionLevels;
  let company: PermissionLevels;
  let space: PermissionLevels;

  if (current === null) {
    annonymous = parent.public!;
    company = parent.company!;
    space = COMMENT_ACCESS.value;
  } else {
    annonymous = current.public!;
    company = current.company!;
    space = current.space!;
  }

  return {
    anonymous: annonymous,
    anonymousOptions: ANNON.filter((o) => o.value <= parent.public!),
    companyMembers: company,
    companyMembersOptions: COMPANY.filter((o) => o.value >= parent.public! && o.value <= parent.company!),
    spaceMembers: space,
    spaceMembersOptions: SPACE,
  };
}

export function applyAccessLevelConstraints(vals: AccessLevels, parent: Api.AccessLevels): AccessLevels {
  vals.anonymousOptions = ANNON.filter((o) => o.value <= parent.public!);
  vals.anonymous = clamp(vals.anonymous, vals.anonymousOptions);

  vals.companyMembersOptions = COMPANY.filter((o) => o.value >= vals.anonymous && o.value <= parent.company!);
  vals.companyMembers = clamp(vals.companyMembers, vals.companyMembersOptions);

  vals.spaceMembersOptions = SPACE.filter((option) => option.value >= vals.companyMembers);
  vals.spaceMembers = clamp(vals.spaceMembers, vals.spaceMembersOptions);

  return vals;
}

function clamp(val: PermissionLevels, options: Option[]): PermissionLevels {
  if (options.some((o) => o.value === val)) {
    return val;
  } else {
    return options[0]!.value;
  }
}
