/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { MemoryRouter } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/api/queryClient";
import { renderHook } from "@/__tests__/renderHook";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { SpaceKpisPage } from "turboui";
import { Page } from "./page";

jest.mock("@/i18n", () => ({ __esModule: true, default: { t: (key: string) => key } }));
jest.mock("@/api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({ useMe: jest.fn() }));
jest.mock("@/hooks/useFormattedTimePreferences", () => ({ useFormattedTimePreferences: () => ({}) }));
jest.mock("@/hooks/useRichTextHandlers", () => ({ useRichTextHandlers: () => ({}) }));
jest.mock("@/models/subscriptions", () => ({ useSubscription: () => ({}) }));
jest.mock("@/models/people", () => ({
  ...jest.requireActual("@/models/people"),
  usePeopleSearch: () => jest.fn().mockResolvedValue([]),
}));
jest.mock("./KpiEntryComments", () => ({ KpiEntryComments: () => null }));
jest.mock("./loader", () => ({
  useLoadedData: () => ({ space: { id: "space1", name: "Growth" }, kpis: [], kpi: null }),
  useRefresh: () => jest.fn(),
}));
jest.mock("@/routes/paths", () => ({
  usePaths: () => ({
    profilePath: (id: string) => `/profiles/${id}`,
    spacePath: (id: string) => `/spaces/${id}`,
    spaceKpisPath: (id: string) => `/spaces/${id}/kpis`,
  }),
}));
jest.mock("turboui", () => ({ SpaceKpisPage: jest.fn(() => null) }));

afterEach(() => {
  jest.clearAllMocks();
  queryClient.clear();
});

test("passes the authenticated current-company person to the shared KPI page", () => {
  const person: NonNullable<ReturnType<typeof useMe>> = {
    __typename: "person",
    id: "person1",
    fullName: "Morgan Chen",
    email: "morgan@example.com",
    type: "human",
    title: "Growth Lead",
    avatarUrl: "/morgan.png",
  };
  jest.mocked(useMe).mockReturnValue(person);

  const wrapper = ({ children }: React.PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Page />
      </MemoryRouter>
      {children}
    </QueryClientProvider>
  );
  renderHook(() => null, { initialProps: undefined, wrapper });

  expect(jest.mocked(SpaceKpisPage).mock.calls.at(-1)?.[0].currentUser).toEqual({
    id: person.id,
    fullName: person.fullName,
    email: person.email,
    title: person.title,
    avatarUrl: person.avatarUrl,
    profileLink: `/profiles/${person.id}`,
  });
});
