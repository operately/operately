/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import type { Space } from "@/api";
import { renderHook } from "@/__tests__/renderHook";
import { usePredictivePreloading } from "@/routes/preloading/PagePreloading";
import { useHomePagePreloading } from "./useHomePagePreloading";

jest.mock("@/routes/preloading/PagePreloading", () => ({ usePredictivePreloading: jest.fn() }));
jest.mock("@/routes/paths", () => ({
  includesId: (ids: string[], id: string) => ids.includes(id),
  usePaths: () => ({
    workMapPath: () => "/company/work-map",
    profilePath: (id: string) => `/company/people/${id}`,
    reviewPath: () => "/company/review",
    spacePath: (id: string) => `/company/spaces/${id}`,
  }),
}));

const spaces: Space[] = [
  {
    __typename: "space",
    id: "joined",
    name: "Joined",
    members: [
      {
        __typename: "person",
        id: "me",
        fullName: "Me",
        title: "",
        avatarUrl: null,
        email: "me@example.com",
        type: "team_member",
      },
    ],
  },
  { __typename: "space", id: "public", name: "Public", members: [] },
  { __typename: "space", id: "unknown", name: "Unknown" },
];

it("queues navigation destinations followed by membership spaces, not every accessible space", () => {
  renderHook(() => useHomePagePreloading({ spaces, personId: "me", enabled: true }), { initialProps: undefined });

  expect(usePredictivePreloading).toHaveBeenLastCalledWith([
    "/company/work-map",
    "/company/people/me",
    "/company/review",
    "/company/spaces/joined",
  ]);
});

it("does not queue Home destinations when Home is redirecting", () => {
  renderHook(() => useHomePagePreloading({ spaces, personId: "me", enabled: false }), { initialProps: undefined });

  expect(usePredictivePreloading).toHaveBeenLastCalledWith([]);
});
