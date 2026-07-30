import { Paths } from "./paths";

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
});
