/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { renderHook } from "@/__tests__/renderHook";
import { ContentListSkeleton, LobbyPage } from "turboui";
import page from "./index";

jest.mock("./loader", () => ({ loader: jest.fn(), useLoadedData: () => mockLoadedData }));
jest.mock("turboui", () => ({
  ContentListSkeleton: jest.fn(() => null),
  LobbyPage: jest.fn(() => null),
}));

let mockLoadedData: {
  account: { fullName: string; siteAdmin: boolean };
  companies: { id: string; name: string; memberCount: number }[];
} | null = null;

beforeEach(() => {
  mockLoadedData = null;
  jest.clearAllMocks();
  window.appConfig = { releaseVersion: "test" } as typeof window.appConfig;
});

it("shows loading feedback before rendering the recovered company picker", () => {
  const { rerender } = renderHook(() => null, { initialProps: undefined, wrapper: page.Page });
  expect(ContentListSkeleton).toHaveBeenCalledTimes(1);
  expect(LobbyPage).not.toHaveBeenCalled();

  mockLoadedData = {
    account: { fullName: "Ada Lovelace", siteAdmin: false },
    companies: [
      { id: "first", name: "First", memberCount: 2 },
      { id: "second", name: "Second", memberCount: 3 },
    ],
  };
  rerender(undefined);

  expect(jest.mocked(LobbyPage).mock.calls.at(-1)?.[0]).toMatchObject({
    firstName: "Ada",
    companies: [
      { id: "first", name: "First", memberCount: 2 },
      { id: "second", name: "Second", memberCount: 3 },
    ],
  });
});
