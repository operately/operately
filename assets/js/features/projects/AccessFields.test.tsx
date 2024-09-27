import { PermissionLevels } from "../Permissions";
import { applyAccessLevelConstraints, initialAccessLevels, AccessLevels } from "./AccessFields";

describe("applyAccessLevelConstraints", () => {
  let values: AccessLevels;
  let parentAccessLevels: any;

  beforeEach(() => {
    parentAccessLevels = {
      public: PermissionLevels.VIEW_ACCESS,
      company: PermissionLevels.FULL_ACCESS,
    };

    values = initialAccessLevels(parentAccessLevels);
  });

  test("if annonymous people don't have access to the space, they should not have access to the project as well", () => {
    values.anonymous = PermissionLevels.FULL_ACCESS;
    parentAccessLevels.public = PermissionLevels.NO_ACCESS;

    applyAccessLevelConstraints(values, parentAccessLevels);
    expect(values.anonymous).toBe(PermissionLevels.NO_ACCESS);
    expect(values.anonymousOptions.map((o: any) => o.value)).toEqual([PermissionLevels.NO_ACCESS]);
  });

  test("if company members don't have access to the space, they should not have access to the project as well", () => {
    values.companyMembers = PermissionLevels.FULL_ACCESS;
    parentAccessLevels.company = PermissionLevels.EDIT_ACCESS;

    applyAccessLevelConstraints(values, parentAccessLevels);
    expect(values.companyMembers).toBe(PermissionLevels.EDIT_ACCESS);
    expect(values.companyMembersOptions.map((o: any) => o.value)).toEqual([
      PermissionLevels.EDIT_ACCESS,
      PermissionLevels.COMMENT_ACCESS,
      PermissionLevels.VIEW_ACCESS,
    ]);
  });

  test("company members cannot have less access than annonymous members", () => {
    parentAccessLevels.company = PermissionLevels.EDIT_ACCESS;
    values.anonymous = PermissionLevels.VIEW_ACCESS;
    values.companyMembers = PermissionLevels.NO_ACCESS;

    applyAccessLevelConstraints(values, parentAccessLevels);
    expect(values.companyMembers).toBe(PermissionLevels.EDIT_ACCESS);
    expect(values.companyMembersOptions.map((o: any) => o.value)).toEqual([
      PermissionLevels.EDIT_ACCESS,
      PermissionLevels.COMMENT_ACCESS,
      PermissionLevels.VIEW_ACCESS,
    ]);
  });
});
