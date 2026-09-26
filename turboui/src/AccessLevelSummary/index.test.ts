import React from "react";
import { act, render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import { AccessLevelSummary, calcDescription } from "./index";

const VIEW_ACCESS = 10;
const COMMENT_ACCESS = 40;
const EDIT_ACCESS = 70;
const FULL_ACCESS = 100;
const NO_ACCESS = 0;

describe("calcDescription (spaces)", () => {
  test.each([
    ["present", "Anyone on the internet can view this space."],
    ["future", "Anyone on the internet will be able to view this space."],
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
    ["present", COMMENT_ACCESS, "Anyone on the internet can view this space. Company members can view and comment."],
    [
      "future",
      COMMENT_ACCESS,
      "Anyone on the internet will be able to view this space. Company members will be able to view and comment.",
    ],
    ["present", EDIT_ACCESS, "Anyone on the internet can view this space. Company members have edit access."],
    [
      "future",
      EDIT_ACCESS,
      "Anyone on the internet will be able to view this space. Company members will have edit access.",
    ],
    ["present", FULL_ACCESS, "Anyone on the internet can view this space. Company members have full access."],
    [
      "future",
      FULL_ACCESS,
      "Anyone on the internet will be able to view this space. Company members will have full access.",
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
    ["present", VIEW_ACCESS, "Everyone in the company can view this space."],
    ["future", VIEW_ACCESS, "Everyone in the company will be able to view this space."],
    ["present", COMMENT_ACCESS, "Everyone in the company can view and comment on this space."],
    ["future", COMMENT_ACCESS, "Everyone in the company will be able to view and comment on this space."],
    ["present", EDIT_ACCESS, "Everyone in the company can view and edit this space."],
    ["future", EDIT_ACCESS, "Everyone in the company will be able to view and edit this space."],
    ["present", FULL_ACCESS, "Everyone in the company has full access to this space."],
    ["future", FULL_ACCESS, "Everyone in the company will have full access to this space."],
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
    ["present", "Only people you add to the space can view it."],
    ["future", "Only people you add to the space will be able to view it."],
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
    ["present", "Anyone on the internet can view this project."],
    ["future", "Anyone on the internet will be able to view this project."],
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
    ["present", COMMENT_ACCESS, "Anyone on the internet can view this project. Company members can view and comment."],
    [
      "future",
      COMMENT_ACCESS,
      "Anyone on the internet will be able to view this project. Company members will be able to view and comment.",
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

  test.each([
    [
      "present",
      VIEW_ACCESS,
      COMMENT_ACCESS,
      "Everyone in the company can view this project. Space members can view and comment.",
    ],
    [
      "future",
      VIEW_ACCESS,
      COMMENT_ACCESS,
      "Everyone in the company will be able to view this project. Space members will be able to view and comment.",
    ],
    [
      "present",
      VIEW_ACCESS,
      EDIT_ACCESS,
      "Everyone in the company can view this project. Space members have edit access.",
    ],
    [
      "future",
      VIEW_ACCESS,
      EDIT_ACCESS,
      "Everyone in the company will be able to view this project. Space members will have edit access.",
    ],
    [
      "present",
      VIEW_ACCESS,
      FULL_ACCESS,
      "Everyone in the company can view this project. Space members have full access.",
    ],
    [
      "future",
      VIEW_ACCESS,
      FULL_ACCESS,
      "Everyone in the company will be able to view this project. Space members will have full access.",
    ],
    [
      "present",
      COMMENT_ACCESS,
      EDIT_ACCESS,
      "Everyone in the company can view and comment on this project. Space members have edit access.",
    ],
    [
      "future",
      COMMENT_ACCESS,
      EDIT_ACCESS,
      "Everyone in the company will be able to view and comment on this project. Space members will have edit access.",
    ],
    [
      "present",
      COMMENT_ACCESS,
      FULL_ACCESS,
      "Everyone in the company can view and comment on this project. Space members have full access.",
    ],
    [
      "future",
      COMMENT_ACCESS,
      FULL_ACCESS,
      "Everyone in the company will be able to view and comment on this project. Space members will have full access.",
    ],
    [
      "present",
      EDIT_ACCESS,
      FULL_ACCESS,
      "Everyone in the company can view and edit this project. Space members have full access.",
    ],
    [
      "future",
      EDIT_ACCESS,
      FULL_ACCESS,
      "Everyone in the company will be able to view and edit this project. Space members will have full access.",
    ],
  ] as const)("when company has access but space has more (%s, %s, %s)", (tense, company, space, expected) => {
    expect(
      calcDescription({
        resourceType: "project",
        tense,
        anonymous: NO_ACCESS,
        company,
        space,
      }),
    ).toEqual(expected);
  });

  test.each([
    ["present", VIEW_ACCESS, "Everyone in the space can view this project."],
    ["future", COMMENT_ACCESS, "Everyone in the space will be able to view and comment on this project."],
    ["present", EDIT_ACCESS, "Everyone in the space can view and edit this project."],
    ["future", FULL_ACCESS, "Everyone in the space will be able to view and edit this project."],
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
    ["present", "Only people you add to the project can view it."],
    ["future", "Only people you add to the project will be able to view it."],
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
    ).toEqual("Everyone in the company can view and edit this goal.");
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
    ).toEqual("Everyone in the space will be able to view this goal.");
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
    ).toEqual("Only people you add to the goal can view it.");
  });
});

describe("translated access descriptions", () => {
  beforeAll(() => {
    i18n.addResourceBundle("pt-BR", "translation", {
      "Anyone on the internet can view this project.": "Qualquer pessoa na internet pode visualizar este projeto.",
      "Everyone in the company can view and comment on this goal.":
        "Todas as pessoas da empresa podem visualizar e comentar neste objetivo.",
      "Everyone in the space will be able to view and edit this goal.":
        "Todas as pessoas do espaço poderão visualizar e editar este objetivo.",
      "Only people you add to the space will be able to view it.":
        "Somente as pessoas adicionadas ao espaço poderão visualizá-lo.",
      "Company members have edit access.": "Os membros da empresa têm acesso de edição.",
      "Everyone in the company will be able to view this goal.":
        "Todas as pessoas da empresa poderão visualizar este objetivo.",
      "Space members will have full access.": "Os membros do espaço terão acesso total.",
    });
  });

  beforeEach(async () => {
    await i18n.changeLanguage("pt-BR");
  });
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });
  afterAll(() => {
    i18n.removeResourceBundle("pt-BR", "translation");
  });

  test.each([
    [
      { resourceType: "project", tense: "present", anonymous: VIEW_ACCESS, company: EDIT_ACCESS },
      "Qualquer pessoa na internet pode visualizar este projeto. Os membros da empresa têm acesso de edição.",
    ],
    [
      { resourceType: "goal", tense: "present", anonymous: NO_ACCESS, company: COMMENT_ACCESS },
      "Todas as pessoas da empresa podem visualizar e comentar neste objetivo.",
    ],
    [
      { resourceType: "goal", tense: "future", anonymous: NO_ACCESS, company: NO_ACCESS, space: EDIT_ACCESS },
      "Todas as pessoas do espaço poderão visualizar e editar este objetivo.",
    ],
    [
      { resourceType: "goal", tense: "future", anonymous: NO_ACCESS, company: VIEW_ACCESS, space: FULL_ACCESS },
      "Todas as pessoas da empresa poderão visualizar este objetivo. Os membros do espaço terão acesso total.",
    ],
    [
      { resourceType: "space", tense: "future", anonymous: NO_ACCESS, company: NO_ACCESS },
      "Somente as pessoas adicionadas ao espaço poderão visualizá-lo.",
    ],
  ] as const)("translates the complete description for %o", (props, expected) => {
    expect(calcDescription(props)).toBe(expected);
  });
});

test.each(["en", "pt-BR"])("translates access sentences independently with English fallback (%s)", async (language) => {
  const instance = createInstance();
  const base = "Anyone on the internet can view this space.";
  const extra = "Company members have full access.";
  await instance.init({
    lng: language,
    fallbackLng: "en",
    keySeparator: false,
    resources: { en: { translation: { [base]: base, [extra]: extra } }, "pt-BR": { translation: {} } },
  });
  const props = { resourceType: "space", tense: "present", anonymous: VIEW_ACCESS, company: FULL_ACCESS } as const;

  expect(calcDescription(props, instance.t.bind(instance))).toBe(`${base} ${extra}`);
  instance.addResourceBundle(language, "translation", { [base]: "Translated public access." }, true, true);
  expect(calcDescription(props, instance.t.bind(instance))).toBe(`Translated public access. ${extra}`);
  instance.addResourceBundle(language, "translation", { [extra]: "Translated company access." }, true, true);
  expect(calcDescription(props, instance.t.bind(instance))).toBe(
    "Translated public access. Translated company access.",
  );
});

test("updates the title and description using the provider's language", async () => {
  const instance = createInstance();
  await instance.init({
    lng: "en",
    fallbackLng: "en",
    keySeparator: false,
    resources: {
      "pt-BR": {
        translation: {
          "Invite-only Access": "Acesso somente por convite",
          "Only people you add to the goal can view it.":
            "Somente as pessoas adicionadas ao objetivo podem visualizá-lo.",
        },
      },
    },
  });
  render(
    React.createElement(
      I18nextProvider,
      { i18n: instance },
      React.createElement(AccessLevelSummary, {
        resourceType: "goal",
        tense: "present",
        anonymous: NO_ACCESS,
        company: NO_ACCESS,
      }),
    ),
  );
  expect(screen.getByText("Only people you add to the goal can view it.")).toBeTruthy();
  await act(async () => {
    await instance.changeLanguage("pt-BR");
  });
  expect(screen.getByText("Acesso somente por convite")).toBeTruthy();
  expect(screen.getByText("Somente as pessoas adicionadas ao objetivo podem visualizá-lo.")).toBeTruthy();
});
