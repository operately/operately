import { Paths, internalReturnPath, authPath } from "./paths";

describe("curated template paths", () => {
  it("encodes template IDs as a single path segment", () => {
    expect(Paths.curatedTemplateEntryPath("revenue/example?#")).toBe("/templates/revenue%2Fexample%3F%23/use");
    expect(new Paths({ companyId: "acme" }).curatedTemplateUsePath("revenue/example?#")).toBe(
      "/acme/templates/revenue%2Fexample%3F%23/use",
    );
  });

  it("preserves a template return path through company creation", () => {
    const returnPath = Paths.curatedTemplateEntryPath("increase-revenue-example");
    expect(Paths.newCompanyPath()).toBe("/new");
    const url = new URL(Paths.newCompanyPath({ redirectTo: returnPath }), "http://localhost");
    expect(url.pathname).toBe("/new");
    expect(url.searchParams.get("redirect_to")).toBe(returnPath);
  });
});

describe("Paths.companyBillingPath", () => {
  it("builds the company billing path without query params", () => {
    expect(new Paths({ companyId: "acme" }).companyBillingPath()).toBe("/acme/admin/billing");
  });

  it("builds the company billing path with checkout return params", () => {
    expect(new Paths({ companyId: "acme" }).companyBillingPath({ checkoutId: "chk_123" })).toBe(
      "/acme/admin/billing?checkout_id=chk_123",
    );
  });
});

describe("Paths.companyWorkMapPath", () => {
  it("builds the company Work Map path before a company-scoped Paths instance exists", () => {
    expect(Paths.companyWorkMapPath("acme")).toBe("/acme/work-map");
  });
});

describe("Paths.companyBillingPlansPath", () => {
  it("builds the company billing plans path without query params", () => {
    expect(new Paths({ companyId: "acme" }).companyBillingPlansPath()).toBe("/acme/admin/billing/plans");
  });

  it("builds the company billing plans path with billing intent params", () => {
    expect(
      new Paths({ companyId: "acme" }).companyBillingPlansPath({
        plan: "team",
        billingPeriod: "yearly",
      }),
    ).toBe("/acme/admin/billing/plans?plan=team&billing_period=yearly");
  });
});

describe("project template paths", () => {
  const paths = new Paths({ companyId: "acme" });

  it("builds company, Space, and editor paths", () => {
    expect(paths.projectTemplatesPath()).toBe("/acme/project-templates");
    expect(paths.spaceProjectTemplatesPath("growth")).toBe("/acme/spaces/growth/project-templates");
    expect(paths.newProjectTemplatePath("growth")).toBe("/acme/spaces/growth/project-templates?new=true");
    expect(paths.projectTemplatePath("launch")).toBe("/acme/project-templates/launch");
    expect(paths.projectTemplateMilestonePath("launch", "kickoff")).toBe(
      "/acme/project-templates/launch/milestones/kickoff",
    );
    expect(paths.projectTemplatePath("launch", { tab: "docs-and-files" })).toBe(
      "/acme/project-templates/launch?tab=docs-and-files",
    );
    expect(paths.projectTemplatePath("launch", { folderId: "assets", tab: "overview" })).toBe(
      "/acme/project-templates/launch?tab=docs-and-files&folderId=assets",
    );
  });
});

describe("authentication return paths", () => {
  test.each(["//evil.test", "/\\evil.test", "https://evil.test", "/%2fevil.test", "/\nevil.test"])(
    "rejects %s",
    (path) => {
      expect(internalReturnPath(path)).toBeNull();
    },
  );

  test("preserves internal paths and query values without decoding twice", () => {
    const path = "/templates/example/use?source=website#form";
    expect(internalReturnPath(path)).toBe(path);
    expect(
      new URLSearchParams(authPath("/sign_up", `?redirect_to=${encodeURIComponent(path)}`).split("?")[1]).get(
        "redirect_to",
      ),
    ).toBe(path);
  });

  test.each([
    "/templates/example/use?source=%2Fcatalog#form",
    "/templates/example/use?source=%5Ccatalog&next=%2F%2Fevil.test#form",
    "/templates/example/use#section%2Fdetails",
  ])("preserves encoded query and fragment values: %s", (path) => {
    expect(internalReturnPath(path)).toBe(path);
    const search = new URLSearchParams({ redirect_to: path, invite_token: "invite" }).toString();
    for (const destination of ["/log_in", "/sign_up"]) {
      const url = new URL(authPath(destination, search), "https://operately.test");
      expect(url.searchParams.get("redirect_to")).toBe(path);
      expect(url.searchParams.get("invite_token")).toBe("invite");
    }
  });
});
