import { PermissionLevels } from "@/features/Permissions";

import { calcDescription } from "./index";

describe("calcDescription (spaces)", () => {
  test.each([
    ["present", "Anyone on the internet can view this space"],
    ["future", "Anyone on the internet will be able to view this space"],
  ] as const)("when anonymous has access (%s)", (tense, expected) => {
    expect(
      calcDescription({
        tense,
        anonymous: PermissionLevels.VIEW_ACCESS,
        company: PermissionLevels.NO_ACCESS,
      }),
    ).toEqual(expected);
  });

  test.each([
    [
      "present",
      PermissionLevels.COMMENT_ACCESS,
      "Anyone on the internet can view this space, company members can view and comment",
    ],
    [
      "future",
      PermissionLevels.COMMENT_ACCESS,
      "Anyone on the internet will be able to view this space, company members will be able to view and comment",
    ],
    ["present", PermissionLevels.EDIT_ACCESS, "Anyone on the internet can view this space, company members can edit"],
    [
      "future",
      PermissionLevels.EDIT_ACCESS,
      "Anyone on the internet will be able to view this space, company members will be able to edit",
    ],
    ["present", PermissionLevels.FULL_ACCESS, "Anyone on the internet can view this space, company members have full access"],
    [
      "future",
      PermissionLevels.FULL_ACCESS,
      "Anyone on the internet will be able to view this space, company members will have full access",
    ],
  ] as const)("when anonymous has access but company has more (%s, %s)", (tense, company, expected) => {
    expect(
      calcDescription({
        tense,
        anonymous: PermissionLevels.VIEW_ACCESS,
        company,
      }),
    ).toEqual(expected);
  });

  test.each([
    ["present", PermissionLevels.VIEW_ACCESS, "Everyone in the company can view this space"],
    ["future", PermissionLevels.VIEW_ACCESS, "Everyone in the company will be able to view this space"],
    ["present", PermissionLevels.COMMENT_ACCESS, "Everyone in the company can view and comment on this space"],
    ["future", PermissionLevels.COMMENT_ACCESS, "Everyone in the company will be able to view and comment on this space"],
    ["present", PermissionLevels.EDIT_ACCESS, "Everyone in the company can view and edit this space"],
    ["future", PermissionLevels.EDIT_ACCESS, "Everyone in the company will be able to view and edit this space"],
    ["present", PermissionLevels.FULL_ACCESS, "Everyone in the company has full access to this space"],
    ["future", PermissionLevels.FULL_ACCESS, "Everyone in the company will have full access to this space"],
  ] as const)("when company has access (%s, %s)", (tense, company, expected) => {
    expect(
      calcDescription({
        tense,
        anonymous: PermissionLevels.NO_ACCESS,
        company,
      }),
    ).toEqual(expected);
  });

  test.each([
    ["present", "Only people you add to the space can view it"],
    ["future", "Only people you add to the space will be able to view it"],
  ] as const)("when invite-only (%s)", (tense, expected) => {
    expect(
      calcDescription({
        tense,
        anonymous: PermissionLevels.NO_ACCESS,
        company: PermissionLevels.NO_ACCESS,
      }),
    ).toEqual(expected);
  });
});
