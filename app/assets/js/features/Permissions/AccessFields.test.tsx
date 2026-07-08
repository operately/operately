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

    values = initialAccessLevels(null, parentAccessLevels);
  });

  test("if anonymous people don't have access to the space, they should not have access to the project as well", () => {
    values.anonymous = PermissionLevels.FULL_ACCESS;
    parentAccessLevels.public = PermissionLevels.NO_ACCESS;

    applyAccessLevelConstraints(values, parentAccessLevels);
    expect(values.anonymous).toBe(PermissionLevels.NO_ACCESS);
    expect(values.anonymousOptions.map((o: any) => o.value)).toEqual([PermissionLevels.NO_ACCESS]);
  });

  test("company members cannot have more access than space members", () => {
    values.anonymous = PermissionLevels.NO_ACCESS;
    values.spaceMembers = PermissionLevels.VIEW_ACCESS;
    values.companyMembers = PermissionLevels.FULL_ACCESS;

    applyAccessLevelConstraints(values, parentAccessLevels);
    expect(values.companyMembers).toBe(PermissionLevels.VIEW_ACCESS);
    expect(values.companyMembersOptions.map((o: any) => o.value)).toEqual([
      PermissionLevels.VIEW_ACCESS,
      PermissionLevels.NO_ACCESS,
    ]);
  });

  test("when space members have full access, company members can also have full access", () => {
    values.anonymous = PermissionLevels.NO_ACCESS;
    values.spaceMembers = PermissionLevels.FULL_ACCESS;
    values.companyMembers = PermissionLevels.FULL_ACCESS;

    applyAccessLevelConstraints(values, parentAccessLevels);
    expect(values.companyMembers).toBe(PermissionLevels.FULL_ACCESS);
    expect(values.companyMembersOptions.map((o: any) => o.value)).toEqual([
      PermissionLevels.FULL_ACCESS,
      PermissionLevels.EDIT_ACCESS,
      PermissionLevels.COMMENT_ACCESS,
      PermissionLevels.VIEW_ACCESS,
      PermissionLevels.NO_ACCESS,
    ]);
  });

  test("company members cannot have less access than anonymous members", () => {
    values.anonymous = PermissionLevels.VIEW_ACCESS;
    values.spaceMembers = PermissionLevels.EDIT_ACCESS;
    values.companyMembers = PermissionLevels.NO_ACCESS;

    applyAccessLevelConstraints(values, parentAccessLevels);
    expect(values.companyMembers).toBe(PermissionLevels.VIEW_ACCESS);
    expect(values.companyMembersOptions.map((o: any) => o.value)).toEqual([
      PermissionLevels.EDIT_ACCESS,
      PermissionLevels.COMMENT_ACCESS,
      PermissionLevels.VIEW_ACCESS,
    ]);
  });

  test("space members cannot have less access than anonymous members", () => {
    values.anonymous = PermissionLevels.VIEW_ACCESS;
    values.spaceMembers = PermissionLevels.NO_ACCESS;

    applyAccessLevelConstraints(values, parentAccessLevels);
    expect(values.spaceMembers).toBe(PermissionLevels.VIEW_ACCESS);
  });

  test("company members cannot exceed the parent space company access", () => {
    values.anonymous = PermissionLevels.NO_ACCESS;
    values.spaceMembers = PermissionLevels.FULL_ACCESS;
    values.companyMembers = PermissionLevels.FULL_ACCESS;
    parentAccessLevels.company = PermissionLevels.NO_ACCESS;

    applyAccessLevelConstraints(values, parentAccessLevels);
    expect(values.companyMembers).toBe(PermissionLevels.NO_ACCESS);
    expect(values.companyMembersOptions.map((o: any) => o.value)).toEqual([PermissionLevels.NO_ACCESS]);
  });
});
