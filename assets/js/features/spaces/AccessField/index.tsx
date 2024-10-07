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
};

const ANNON = [VIEW_ACCESS, NO_ACCESS];
const COMPANY = [FULL_ACCESS, EDIT_ACCESS, COMMENT_ACCESS, VIEW_ACCESS, NO_ACCESS];

export function initialAccessLevels(current?: Api.AccessLevels): AccessLevels {
  let annonymous: PermissionLevels;
  let company: PermissionLevels;

  if (current) {
    annonymous = current.public!;
    company = current.company!;
  } else {
    annonymous = NO_ACCESS.value;
    company = COMMENT_ACCESS.value;
  }

  return {
    anonymous: annonymous,
    anonymousOptions: ANNON,
    companyMembers: company,
    companyMembersOptions: COMPANY.filter((o) => o.value <= company),
  };
}

export function applyAccessLevelConstraints(vals: AccessLevels): AccessLevels {
  vals.anonymousOptions = ANNON;
  vals.anonymous = clamp(vals.anonymous, vals.anonymousOptions);

  vals.companyMembersOptions = COMPANY.filter((o) => o.value >= vals.anonymous);
  vals.companyMembers = clamp(vals.companyMembers, vals.companyMembersOptions);

  return vals;
}

function clamp(val: PermissionLevels, options: Option[]): PermissionLevels {
  if (options.some((o) => o.value === val)) {
    return val;
  } else {
    return options[0]!.value;
  }
}
