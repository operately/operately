import { committedPage } from "./index";

const state = {
  initialized: true,
  navigation: { state: "idle" },
  location: { pathname: "/secret-company/projects/private-title", search: "?token=secret" },
  matches: [
    { route: { path: "/:companyId" }, params: { companyId: "company" } },
    { route: { path: "projects/:id" }, params: {} },
  ],
};

test("committed routes use templates and do not expose slugs or query strings", () => {
  expect(committedPage(state)).toEqual({
    path: "/:companyId/projects/:id",
    key: state.location.pathname + state.location.search,
    companyRef: "company",
  });
});

test("loading and preload states do not produce visits", () => {
  expect(committedPage({ ...state, initialized: false })).toBeNull();
  expect(committedPage({ ...state, navigation: { state: "loading" } })).toBeNull();
});

test("non-company routes clear company context", () => {
  expect(
    committedPage({ ...state, matches: [{ route: { path: "/join/:token" }, params: {} }] })?.companyRef,
  ).toBeUndefined();
});
