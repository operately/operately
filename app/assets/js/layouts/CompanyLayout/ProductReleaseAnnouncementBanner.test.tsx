/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import { MemoryRouter } from "react-router";
import { applyLanguage } from "@/i18n";
import { resolveEffectiveLanguage } from "@/i18n/languages";
import { renderToStaticMarkup } from "react-dom/server";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { ProductReleaseAnnouncementBanner } from "./ProductReleaseAnnouncementBanner";

jest.mock("../../../../../turboui/node_modules/react", () => jest.requireActual("react"));
jest.mock("../../../../../turboui/node_modules/react-router", () => jest.requireActual("react-router"));
jest.mock("../../../../../turboui/node_modules/react-i18next", () => jest.requireActual("react-i18next"));
jest.mock("../../../../../turboui/node_modules/i18next", () => jest.requireActual("i18next"));
jest.mock("../../../../../turboui/src/icons", () => ({ IconX: () => null, IconSparkles: () => null }));
jest.mock("@/contexts/CurrentCompanyContext", () => ({
  useMe: jest.fn(),
}));

jest.mock("@/models/productReleases/productReleaseLifecycle", () => ({
  useDismissProductRelease: () => ({
    mutateAsync: jest.fn(),
  }),
}));

jest.mock("turboui", () => ({
  ...jest.requireActual("../../../../../turboui/src/ProductReleaseAnnouncement"),
  i18nOptions: jest.requireActual("../../../../../turboui/src/i18nOptions").i18nOptions,
}));

const mockUseMe = jest.mocked(useMe);

const release = {
  __typename: "product_release" as const,
  id: "https://operately.com/releases/v180",
  title: "MCP Connections, Scheduled Posts, Retrospective Acknowledgements, and more",
  publishedAt: "2026-07-17T00:00:00Z",
};

function stubMe(dismissedProductReleaseId: string | null) {
  mockUseMe.mockReturnValue({ dismissedProductReleaseId } as ReturnType<typeof useMe>);
}

function renderBanner(productRelease: typeof release | null = release) {
  return renderToStaticMarkup(
    <MemoryRouter>
      <ProductReleaseAnnouncementBanner productRelease={productRelease} />
    </MemoryRouter>,
  );
}

describe("ProductReleaseAnnouncementBanner", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("does not render when there is no release", () => {
    stubMe(null);

    expect(renderBanner(null)).toBe("");
  });

  it("does not render when the current person already dismissed the release", () => {
    stubMe(release.id);

    expect(renderBanner()).toBe("");
  });

  it("renders the toast when the release has not been dismissed", () => {
    stubMe(null);

    const markup = renderBanner();

    expect(markup).toContain("product-release-toast");
    expect(markup).toContain(release.title);
  });
});

afterEach(async () => {
  await applyLanguage("en");
});

test.each([
  [true, "Ver versão"],
  [false, "View release"],
])("release controls respect the language flag: %s", async (enabled, label) => {
  await applyLanguage(resolveEffectiveLanguage("pt-BR", enabled));
  stubMe(null);

  const markup = renderBanner();

  expect(markup).toContain(label);
  expect(markup).toContain(release.title);
});
