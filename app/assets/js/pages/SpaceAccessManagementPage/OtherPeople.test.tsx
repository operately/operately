/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import i18n, { applyLanguage } from "@/i18n";
import { OtherPeople } from "./OtherPeople";

let mockPeople: { id: string; fullName: string; accessLevel: number }[] = [];
jest.mock("./loader", () => ({ useBindedPeopleList: () => ({ people: mockPeople, loading: false }) }));
jest.mock("@/components/Badges/AccessLevelBadges", () => ({ SpaceAccessLevelBadge: () => null }));
jest.mock("turboui", () => ({
  ActionLink: ({ onClick, children }) => <button onClick={onClick}>{children}</button>,
  Avatar: () => null,
  PageSection: ({ children, testId }) => <section data-test-id={testId}>{children}</section>,
}));

const english = { ...i18n.getResourceBundle("en", "translation") };
const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };
const singular = "1 other person has access to this space";

afterEach(async () => {
  for (const [language, resources] of [
    ["en", english],
    ["pt-BR", portuguese],
  ] as const) {
    i18n.removeResourceBundle(language, "translation");
    i18n.addResourceBundle(language, "translation", resources);
  }
  await applyLanguage("en");
});

it.each([
  ["en", 1, "1 other person has access to this space"],
  ["en", 2, "2 other people have access to this space"],
  ["pt-BR", 1, "1 other person has access to this space"],
  ["pt-BR", 2, "2 other people have access to this space"],
  ["substituted", 1, "Translated person with access"],
  ["substituted", 2, "Translated 2 people with access"],
])("renders catalog plurals and expands the access list: %s / %s", async (language, count, expected) => {
  i18n.removeResourceBundle("pt-BR", "translation");
  if (language === "substituted") {
    i18n.addResourceBundle(
      "en",
      "translation",
      {
        [`${singular}_one`]: "Translated person with access",
        [`${singular}_other`]: "Translated {{count}} people with access",
        "show all": "Translated show all",
      },
      true,
      true,
    );
  }
  await applyLanguage(language === "substituted" ? "en" : language);
  mockPeople = Array.from({ length: count }, (_, index) => ({
    id: `person-${index}`,
    fullName: `Original person name ${index}`,
    accessLevel: 10,
  }));
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    act(() => root.render(<OtherPeople />));
    expect(container.textContent).toBe(
      `${expected} (${language === "substituted" ? "Translated show all" : "show all"})`,
    );
    const expand = container.querySelector("button");
    if (!expand) throw new Error("Missing expand action");
    act(() => expand.click());
    expect(container.querySelector('[data-test-id="other-people-list"]')).not.toBeNull();
    expect(container.textContent).toContain("Original person name");
  } finally {
    act(() => root.unmount());
  }
});
