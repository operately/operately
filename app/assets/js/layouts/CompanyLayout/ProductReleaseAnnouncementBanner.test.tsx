import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import Api from "@/api";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import {
  persistDismissedProductRelease,
  ProductReleaseAnnouncementBanner,
} from "./ProductReleaseAnnouncementBanner";

jest.mock("@/models/companies", () => ({
  hasFeature: (company: { enabledExperimentalFeatures?: string[] }, feature: string) =>
    (company.enabledExperimentalFeatures ?? []).includes(feature),
}));

jest.mock("@/contexts/CurrentCompanyContext", () => ({
  useMe: jest.fn(),
}));

jest.mock("@/routes/useCompanyLoaderData", () => ({
  useCompanyLoaderData: jest.fn(),
}));

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    product_releases: {
      dismiss: jest.fn(),
    },
  },
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

const mockUseMe = useMe as jest.Mock;
const mockUseCompanyLoaderData = useCompanyLoaderData as jest.Mock;
const mockDismiss = Api.product_releases.dismiss as jest.Mock;

const release = {
  __typename: "product_release" as const,
  id: "https://operately.com/releases/v180",
  title: "MCP Connections, Scheduled Posts, Retrospective Acknowledgements, and more",
  publishedAt: "2026-07-17T00:00:00Z",
};

function renderBanner(productRelease: typeof release | null = release) {
  return renderToStaticMarkup(<ProductReleaseAnnouncementBanner productRelease={productRelease} />);
}

describe("ProductReleaseAnnouncementBanner", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("does not render when the experimental feature is disabled", () => {
    mockUseCompanyLoaderData.mockReturnValue({
      company: { enabledExperimentalFeatures: [] },
    });
    mockUseMe.mockReturnValue({ dismissedProductReleaseId: null });

    expect(renderBanner()).toBe("");
  });

  it("does not render when there is no release", () => {
    mockUseCompanyLoaderData.mockReturnValue({
      company: { enabledExperimentalFeatures: ["product_release_announcements"] },
    });
    mockUseMe.mockReturnValue({ dismissedProductReleaseId: null });

    expect(renderBanner(null)).toBe("");
  });

  it("does not render when the current person already dismissed the release", () => {
    mockUseCompanyLoaderData.mockReturnValue({
      company: { enabledExperimentalFeatures: ["product_release_announcements"] },
    });
    mockUseMe.mockReturnValue({ dismissedProductReleaseId: release.id });

    expect(renderBanner()).toBe("");
  });

  it("renders the toast when the release has not been dismissed", () => {
    mockUseCompanyLoaderData.mockReturnValue({
      company: { enabledExperimentalFeatures: ["product_release_announcements"] },
    });
    mockUseMe.mockReturnValue({ dismissedProductReleaseId: null });

    const markup = renderBanner();

    expect(markup).toContain("product-release-toast");
    expect(markup).toContain(release.title);
  });

  it("persists the dismissed release id through the API", async () => {
    mockDismiss.mockResolvedValue({ success: true });

    await persistDismissedProductRelease(release.id);

    expect(mockDismiss).toHaveBeenCalledWith({ id: release.id });
  });
});
