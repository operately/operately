import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type * as Companies from "@/models/companies";
import { useCurrentProductRelease } from "@/models/productReleases/currentRelease";
import { HelpDropdown } from "./HelpDropdown";

jest.mock("@/models/productReleases/currentRelease", () => ({
  useCurrentProductRelease: jest.fn(),
}));

jest.mock("@/routes/paths", () => ({
  encodeUrlParams: () => "",
}));

jest.mock("turboui", () => ({
  IconBrandDiscordFilled: () => null,
  IconLifebuoy: () => null,
  IconMail: () => null,
  IconMap2: () => null,
  IconQuestionMark: () => null,
  IconSpeakerphone: () => null,
  PRODUCT_RELEASES_PAGE_URL: "https://operately.com/releases/",
}));

jest.mock("./DropdownMenu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div data-test-id="help-dropdown">{children}</div>,
  DropdownActionItem: ({ title }: { title: string }) => <div>{title}</div>,
  DropdownLinkItem: ({ path, title, hint }: { path: string; title: string; hint?: React.ReactNode }) => (
    <a href={path}>
      {title}
      {hint}
    </a>
  ),
  DropdownSeparator: () => <hr />,
}));

const mockUseCurrentProductRelease = useCurrentProductRelease as jest.Mock;

const company = { id: "company-1", name: "Acme" } as Companies.Company;

function renderDropdown() {
  return renderToStaticMarkup(<HelpDropdown company={company} onOpenKeyboardShortcuts={jest.fn()} />);
}

describe("HelpDropdown", () => {
  beforeEach(() => {
    (global as any).window = {
      appConfig: { discordUrl: "https://discord.example" },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("shows the latest release version next to What's new", () => {
    mockUseCurrentProductRelease.mockReturnValue({ version: "v1.8", title: "MCP Connections, and more" });

    const markup = renderDropdown();

    expect(markup).toContain("help-current-release");
    expect(markup).toContain("What&#x27;s new");
    expect(markup).toContain("v1.8");
    expect(markup).not.toContain("MCP Connections, and more");
    expect(markup).toContain("https://operately.com/releases/");
  });

  it("hides the version when there is no release to advertise", () => {
    mockUseCurrentProductRelease.mockReturnValue(null);

    const markup = renderDropdown();

    expect(markup).toContain("What&#x27;s new");
    expect(markup).not.toContain("help-current-release");
  });
});
