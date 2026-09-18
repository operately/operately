/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { Paths, useOptionalPaths } from "./paths";
import { useRouteLoaderData } from "react-router";
import { renderHook } from "@/__tests__/renderHook";

jest.mock("react-router", () => ({ useRouteLoaderData: jest.fn() }));

it("builds paths from canonical company metadata and supports non-company routes", () => {
  jest.mocked(useRouteLoaderData).mockReturnValue({ companyId: "canonical-company" });
  const { result, rerender } = renderHook(useOptionalPaths, { initialProps: undefined });
  expect(result.current?.homePath()).toBe("/canonical-company");
  jest.mocked(useRouteLoaderData).mockReturnValue(undefined);
  rerender(undefined);
  expect(result.current).toBeNull();
});

describe("Paths", () => {
  test("uses the company home path for the deprecated feed path", () => {
    const paths = new Paths({ companyId: "nexus-dynamics" });

    expect(paths.feedPath()).toEqual("/nexus-dynamics");
  });

  test("builds a company search path with an encoded optional query", () => {
    const paths = new Paths({ companyId: "nexus-dynamics" });

    expect(paths.searchPath()).toEqual("/nexus-dynamics/search");
    expect(paths.searchPath("customer evidence & plans")).toEqual(
      "/nexus-dynamics/search?q=customer+evidence+%26+plans",
    );
  });

  test("builds a project template milestone path", () => {
    const paths = new Paths({ companyId: "nexus-dynamics" });

    expect(paths.projectTemplateMilestonePath("template-1", "milestone-1")).toEqual(
      "/nexus-dynamics/project-templates/template-1/milestones/milestone-1",
    );
  });
});
