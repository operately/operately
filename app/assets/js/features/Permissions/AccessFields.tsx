import * as Api from "@/api";
import {
  COMMENT_ACCESS,
  EDIT_ACCESS,
  FULL_ACCESS,
  NO_ACCESS,
  PermissionLevels,
  VIEW_ACCESS,
} from "@/features/Permissions";

export type Option = { value: PermissionLevels; label: string };

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
// 1. Anonymous access cannot exceed the parent space's public access level.
// 2. Space members access cannot be less than anonymous access.
// 3. Company members access cannot be less than anonymous access.
// 4. Company members access cannot exceed space members access.
// 5. Company members access cannot exceed the parent space's company access level
//    (relevant when creating nested resources in a private space).
//

//
// Available access levels
//
const ANNON = [VIEW_ACCESS, NO_ACCESS];
const COMPANY = [FULL_ACCESS, EDIT_ACCESS, COMMENT_ACCESS, VIEW_ACCESS, NO_ACCESS];
const SPACE = [FULL_ACCESS, EDIT_ACCESS, COMMENT_ACCESS, VIEW_ACCESS, NO_ACCESS];

//
// Edit forms for goals/projects do not expose anonymous access (always no-access).
// Use this parent so company/space selectors are limited by the resource's own
// space members value, not by an external parent cap.
//
export const UNRESTRICTED_PARENT_ACCESS: Api.AccessLevels = {
  public: PermissionLevels.NO_ACCESS,
  company: PermissionLevels.FULL_ACCESS,
  space: PermissionLevels.FULL_ACCESS,
};

export function initialAccessLevels(current: Api.AccessLevels | null, parent: Api.AccessLevels): AccessLevels {
  let annonymous: PermissionLevels;
  let company: PermissionLevels;
  let space: PermissionLevels;

  if (current === null) {
    annonymous = parent.public!;
    company = parent.company!;
    // Default space access is at least comment, and always at least company access.
    space = Math.max(COMMENT_ACCESS.value, company) as PermissionLevels;
  } else {
    annonymous = current.public!;
    company = current.company!;
    space = current.space!;
  }

  return applyAccessLevelConstraints(
    {
      anonymous: annonymous,
      anonymousOptions: ANNON,
      companyMembers: company,
      companyMembersOptions: COMPANY,
      spaceMembers: space,
      spaceMembersOptions: SPACE,
    },
    parent,
  );
}

export function applyAccessLevelConstraints(vals: AccessLevels, parent: Api.AccessLevels): AccessLevels {
  vals.anonymousOptions = ANNON.filter((o) => o.value <= parent.public!);
  vals.anonymous = clamp(vals.anonymous, vals.anonymousOptions);

  vals.spaceMembersOptions = SPACE.filter((option) => option.value >= vals.anonymous);
  vals.spaceMembers = clamp(vals.spaceMembers, vals.spaceMembersOptions);

  vals.companyMembersOptions = COMPANY.filter(
    (o) => o.value >= vals.anonymous && o.value <= vals.spaceMembers && o.value <= parent.company!,
  );
  vals.companyMembers = clamp(vals.companyMembers, vals.companyMembersOptions);

  return vals;
}

function clamp(val: PermissionLevels, options: Option[]): PermissionLevels {
  if (options.some((o) => o.value === val)) {
    return val;
  }

  const max = options[0]!.value;
  const min = options[options.length - 1]!.value;

  if (val > max) return max;
  if (val < min) return min;

  return max;
}
