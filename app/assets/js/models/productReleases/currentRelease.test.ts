import type { ProductRelease } from "@/api";
import type * as Companies from "@/models/companies";

import { currentProductRelease } from "./currentRelease";

function buildCompany(features: string[]) {
  return { id: "company-1", name: "Acme", enabledExperimentalFeatures: features } as Companies.Company;
}

const release = {
  id: "https://operately.com/releases/v180",
  title: "MCP Connections, Scheduled Posts, and more",
} as ProductRelease;

const companyWithFeature = buildCompany(["product_release_announcements"]);

describe("currentProductRelease", () => {
  it("returns the version and title when the feature is enabled", () => {
    expect(currentProductRelease(companyWithFeature, release)).toEqual({
      version: "v1.8",
      title: release.title,
    });
  });

  it("returns nothing when the company does not have the feature", () => {
    expect(currentProductRelease(buildCompany([]), release)).toBeNull();
  });

  it("returns nothing when no release is cached", () => {
    expect(currentProductRelease(companyWithFeature, null)).toBeNull();
  });

  it("returns nothing when the release id is not a version slug", () => {
    const unknown = { ...release, id: "https://operately.com/releases/whats-new" } as ProductRelease;

    expect(currentProductRelease(companyWithFeature, unknown)).toBeNull();
  });
});
