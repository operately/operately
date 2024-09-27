import { PermissionLevels } from "../Permissions";
import { applyAccessLevelConstraints, initialAccessLevels } from "./AccessFields";

describe("applyAccessLevelConstraints", () => {
  let values: any;
  let parentAccessLevels: any;

  beforeEach(() => {
    values = initialAccessLevels();

    parentAccessLevels = {
      public: PermissionLevels.NO_ACCESS,
      company: PermissionLevels.NO_ACCESS,
    };
  });

  test("if annonymous people don't have access to the space, they should not have access to the project as well", () => {
    values.anonymousMembers = PermissionLevels.FULL_ACCESS;
    parentAccessLevels.public = PermissionLevels.NO_ACCESS;

    applyAccessLevelConstraints(values, parentAccessLevels);
    expect(values.anonymousMembers).toBe(PermissionLevels.NO_ACCESS);
  });

  test("if company members don't have access to the space, they should not have access to the project as well", () => {
    values.companyMembers = PermissionLevels.FULL_ACCESS;
    parentAccessLevels.company = PermissionLevels.NO_ACCESS;

    applyAccessLevelConstraints(values, parentAccessLevels);
    expect(values.companyMembers).toBe(PermissionLevels.NO_ACCESS);
  });
});
