/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router";
import i18n, { applyLanguage } from "@/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import HomePageModule from ".";
import { useFeedItemsQuery } from "@/features/Feed";
import { useDeleteFeedActivity } from "@/models/activities/activityLifecycle";
import { showErrorToast } from "turboui";

// Match the single React/i18n runtime used by the app bundle.
jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("../../../../../turboui/node_modules/react-router", () => jest.requireActual("react-router"));
jest.mock("../../../../../turboui/node_modules/react-i18next", () => jest.requireActual("react-i18next"));
jest.mock("../../../../../turboui/node_modules/i18next", () => jest.requireActual("i18next"));

jest.mock("./loader", () => ({
  loader: jest.fn(),
  useLoadedData: () => ({
    company: { id: "company", setupCompleted: true, permissions: {} },
    spaces: [],
    hasWorkItems: true,
    ownerIds: [],
    adminIds: [],
  }),
}));
jest.mock("./useHomePagePreloading", () => ({ useHomePagePreloading: jest.fn() }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: () => ({ id: "person", fullName: "Ana Silva" }) }));
jest.mock("@/models/people", () => ({ firstName: () => "Ana" }));
jest.mock("@/models/activities/activityLifecycle", () => ({ useDeleteFeedActivity: jest.fn() }));
jest.mock("@/routes/paths", () => ({
  includesId: () => false,
  usePaths: () => ({ newSpacePath: () => "/spaces/new", invitePeoplePath: () => "/invite" }),
}));
jest.mock("@/features/Feed", () => ({
  useFeedItemsQuery: jest.fn(),
  Feed: ({ onDeleteItem }) => <button onClick={() => onDeleteItem({ id: "activity" })}>Delete fixture</button>,
}));
jest.mock("turboui", () => ({
  ...jest.requireActual("../../../../../turboui/src/HomePage"),
  i18nOptions: jest.requireActual("../../../../../turboui/src/i18nOptions").i18nOptions,
  showErrorToast: jest.fn(),
}));

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  root = createRoot(container);
  jest.mocked(useFeedItemsQuery).mockReturnValue(feedResult());
  jest
    .mocked(useDeleteFeedActivity)
    .mockReturnValue({ mutateAsync: jest.fn().mockRejectedValue(new Error("failure")) } as unknown as ReturnType<
      typeof useDeleteFeedActivity
    >);
});
afterEach(async () => {
  act(() => root.unmount());
  await applyLanguage("en");
  jest.clearAllMocks();
});
function renderPage() {
  act(() =>
    root.render(
      <MemoryRouter>
        <HomePageModule.Page />
      </MemoryRouter>,
    ),
  );
}

test.each([
  [true, "Nenhum espaço ainda"],
  [false, "No spaces yet"],
])("saved Portuguese preference respects flag %s", async (enabled, emptyLabel) => {
  await applyLanguage(resolveEffectiveLanguage("pt-BR", enabled));
  renderPage();
  expect(container.textContent).toContain(emptyLabel);
});

test("feed errors and delete failures use translated messages", async () => {
  await applyLanguage("pt-BR");
  renderPage();
  await act(async () => container.querySelector("button")?.click());
  expect(showErrorToast).toHaveBeenCalledWith("Não foi possível excluir o item do feed", "Tente novamente.");
  jest.mocked(useFeedItemsQuery).mockReturnValue(feedResult(new Error("failure")));
  const original = i18n.getResource("pt-BR", "translation", "Error");
  try {
    i18n.addResource("pt-BR", "translation", "Error", "Translated feed error");
    renderPage();
    expect(container.textContent).toContain("Translated feed error");
  } finally {
    i18n.addResource("pt-BR", "translation", "Error", original);
  }
});

function feedResult(error: Error | null = null): ReturnType<typeof useFeedItemsQuery> {
  return {
    loading: false,
    error,
    data: { activities: [] },
    refetch: jest.fn(),
    pagination: {
      targetActivityId: undefined,
      observationKey: "company",
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      hasError: false,
      onLoadMore: jest.fn(),
    },
  };
}
