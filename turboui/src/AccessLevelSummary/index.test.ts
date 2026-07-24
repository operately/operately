import { calcDescription } from "./index";

const VIEW_ACCESS = 10;
const COMMENT_ACCESS = 40;
const EDIT_ACCESS = 70;
const FULL_ACCESS = 100;
const NO_ACCESS = 0;

describe("calcDescription (spaces)", () => {
  test.each([
    ["present", "Anyone on the internet can view this space"],
    ["future", "Anyone on the internet will be able to view this space"],
  ] as const)("when anonymous has access (%s)", (tense, expected) => {
    expect(
      calcDescription({
        resourceType: "space",
        tense,
        anonymous: VIEW_ACCESS,
        company: NO_ACCESS,
      }),
    ).toEqual(expected);
  });

  test.each([
    ["present", COMMENT_ACCESS, "Anyone on the internet can view this space, company members can view and comment"],
    [
      "future",
      COMMENT_ACCESS,
      "Anyone on the internet will be able to view this space, company members will be able to view and comment",
    ],
    ["present", EDIT_ACCESS, "Anyone on the internet can view this space, company members can edit"],
    [
      "future",
      EDIT_ACCESS,
      "Anyone on the internet will be able to view this space, company members will be able to edit",
    ],
    ["present", FULL_ACCESS, "Anyone on the internet can view this space, company members have full access"],
    [
      "future",
      FULL_ACCESS,
      "Anyone on the internet will be able to view this space, company members will have full access",
    ],
  ] as const)("when anonymous has access but company has more (%s, %s)", (tense, company, expected) => {
    expect(
      calcDescription({
        resourceType: "space",
        tense,
        anonymous: VIEW_ACCESS,
        company,
      }),
    ).toEqual(expected);
  });

  test.each([
    ["present", VIEW_ACCESS, "Everyone in the company can view this space"],
    ["future", VIEW_ACCESS, "Everyone in the company will be able to view this space"],
    ["present", COMMENT_ACCESS, "Everyone in the company can view and comment on this space"],
    ["future", COMMENT_ACCESS, "Everyone in the company will be able to view and comment on this space"],
    ["present", EDIT_ACCESS, "Everyone in the company can view and edit this space"],
    ["future", EDIT_ACCESS, "Everyone in the company will be able to view and edit this space"],
    ["present", FULL_ACCESS, "Everyone in the company has full access to this space"],
    ["future", FULL_ACCESS, "Everyone in the company will have full access to this space"],
  ] as const)("when company has access (%s, %s)", (tense, company, expected) => {
    expect(
      calcDescription({
        resourceType: "space",
        tense,
        anonymous: NO_ACCESS,
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
        resourceType: "space",
        tense,
        anonymous: NO_ACCESS,
        company: NO_ACCESS,
      }),
    ).toEqual(expected);
  });
});

describe("calcDescription (projects)", () => {
  test.each([
    ["present", "Anyone on the internet can view this project"],
    ["future", "Anyone on the internet will be able to view this project"],
  ] as const)("when anonymous has access (%s)", (tense, expected) => {
    expect(
      calcDescription({
        resourceType: "project",
        tense,
        anonymous: VIEW_ACCESS,
        company: NO_ACCESS,
        space: NO_ACCESS,
      }),
    ).toEqual(expected);
  });

  test.each([
    ["present", COMMENT_ACCESS, "Anyone on the internet can view this project, company members can view and comment"],
    [
      "future",
      COMMENT_ACCESS,
      "Anyone on the internet will be able to view this project, company members will be able to view and comment",
    ],
  ] as const)("when anonymous has access but company has more (%s, %s)", (tense, company, expected) => {
    expect(
      calcDescription({
        resourceType: "project",
        tense,
        anonymous: VIEW_ACCESS,
        company,
        space: NO_ACCESS,
      }),
    ).toEqual(expected);
  });

  test("when company has access but space has more", () => {
    expect(
      calcDescription({
        resourceType: "project",
        tense: "present",
        anonymous: NO_ACCESS,
        company: VIEW_ACCESS,
        space: COMMENT_ACCESS,
      }),
    ).toEqual("Everyone in the company can view this project, space members can view and comment");
  });

  test.each([
    ["present", VIEW_ACCESS, "Everyone in the space can view this project"],
    ["future", COMMENT_ACCESS, "Everyone in the space will be able to view and comment on this project"],
    ["present", EDIT_ACCESS, "Everyone in the space can view and edit this project"],
    ["future", FULL_ACCESS, "Everyone in the space will be able to view and edit this project"],
  ] as const)("when space-wide (%s, %s)", (tense, space, expected) => {
    expect(
      calcDescription({
        resourceType: "project",
        tense,
        anonymous: NO_ACCESS,
        company: NO_ACCESS,
        space,
      }),
    ).toEqual(expected);
  });

  test.each([
    ["present", "Only people you add to the project can view it"],
    ["future", "Only people you add to the project will be able to view it"],
  ] as const)("when invite-only (%s)", (tense, expected) => {
    expect(
      calcDescription({
        resourceType: "project",
        tense,
        anonymous: NO_ACCESS,
        company: NO_ACCESS,
        space: NO_ACCESS,
      }),
    ).toEqual(expected);
  });
});

describe("calcDescription (goals)", () => {
  test("when company has access", () => {
    expect(
      calcDescription({
        resourceType: "goal",
        tense: "present",
        anonymous: NO_ACCESS,
        company: EDIT_ACCESS,
        space: EDIT_ACCESS,
      }),
    ).toEqual("Everyone in the company can view and edit this goal");
  });

  test("when space-wide", () => {
    expect(
      calcDescription({
        resourceType: "goal",
        tense: "future",
        anonymous: NO_ACCESS,
        company: NO_ACCESS,
        space: VIEW_ACCESS,
      }),
    ).toEqual("Everyone in the space will be able to view this goal");
  });

  test("when invite-only", () => {
    expect(
      calcDescription({
        resourceType: "goal",
        tense: "present",
        anonymous: NO_ACCESS,
        company: NO_ACCESS,
        space: NO_ACCESS,
      }),
    ).toEqual("Only people you add to the goal can view it");
  });
});
