/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import i18n, { applyLanguage } from "@/i18n";
import page from ".";

jest.mock("@/api/queryClient", () => ({
  useLoadedQuery: () => ({ data: { space: { id: "space-1", name: "Marketing" } } }),
}));
jest.mock("@/api", () => ({
  __esModule: true,
  default: { spaces: { getQueryOptions: () => ({}) } },
}));
jest.mock("@/components/Pages", () => ({
  useLoadedData: () => ({ queryInput: { id: "space-1" } }),
  Page: ({ children }) => children,
}));
jest.mock("@/components/PaperContainer", () => ({
  Root: ({ children }) => children,
  Body: ({ children }) => children,
  NavigateBack: () => null,
}));
jest.mock("@/models/spaces", () => ({
  useAddSpaceMembers: () => ({ mutateAsync: jest.fn() }),
  usePotentialSpaceMembersSearch: () => jest.fn(),
}));
jest.mock("react-router", () => ({ useNavigate: () => jest.fn() }));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({ spaceAccessManagementPath: () => "/access", invitePeoplePath: () => "/invite" }),
  compareIds: (a: string, b: string) => a === b,
}));
jest.mock("turboui", () => ({
  Forms: {
    useForm: () => ({ values: { members: [{ key: 1, personId: "", accessLevel: 70 }] } }),
    useFieldValue: () => [[{ key: 1, personId: "", accessLevel: 70 }], jest.fn()],
    Form: ({ children }) => children,
    FieldGroup: ({ children }) => children,
    SelectPerson: () => null,
    SelectBox: () => null,
    Submit: () => null,
  },
  SecondaryButton: ({ children, onClick, ariaLabel }) => (
    <button type="button" aria-label={ariaLabel} onClick={onClick}>
      {children}
    </button>
  ),
  IconPlus: () => null,
  IconX: () => null,
  Link: ({ children }) => <a>{children}</a>,
}));

const english = { ...i18n.getResourceBundle("en", "translation") };
const portuguese = { ...i18n.getResourceBundle("pt-BR", "translation") };
const addAnotherMember = "Add another member";

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
  ["en", "Add another member"],
  ["pt-BR", "Add another member"],
  ["substituted", "Translated add another member"],
])("names the add-member button from the catalog: %s", async (language, expected) => {
  i18n.removeResourceBundle("pt-BR", "translation");
  if (language === "substituted") {
    i18n.addResourceBundle("en", "translation", { [addAnotherMember]: expected }, true, true);
  }
  await applyLanguage(language === "substituted" ? "en" : language);
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  try {
    act(() => root.render(React.createElement(page.Page)));
    expect(container.querySelector(`button[aria-label="${expected}"]`)).not.toBeNull();
  } finally {
    act(() => root.unmount());
  }
});
