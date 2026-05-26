import { Paths } from "./paths";

describe("Paths", () => {
  test("uses the company home path for the deprecated feed path", () => {
    const paths = new Paths({ companyId: "nexus-dynamics" });

    expect(paths.feedPath()).toEqual("/nexus-dynamics");
  });
});
