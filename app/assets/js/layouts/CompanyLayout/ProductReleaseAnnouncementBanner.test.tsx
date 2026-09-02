import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { ProductReleaseAnnouncementBanner } from "./ProductReleaseAnnouncementBanner";

jest.mock("@/contexts/CurrentCompanyContext", () => ({
  useMe: jest.fn(),
}));

jest.mock("@/models/productReleases/productReleaseLifecycle", () => ({
  useDismissProductRelease: () => ({
    mutateAsync: jest.fn(),
  }),
}));

jest.mock("turboui", () => ({
  ProductReleaseAnnouncement: ({
    release,
    onDismiss,
  }: {
    release: { title: string };
    onDismiss: () => void;
  }) => (
    <div data-test-id="product-release-toast">
      <span>{release.title}</span>
      <button type="button" data-test-id="product-release-toast-dismiss" onClick={onDismiss}>
        Dismiss
      </button>
    </div>
  ),
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
  return renderToStaticMarkup(<ProductReleaseAnnouncementBanner productRelease={productRelease} />);
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
