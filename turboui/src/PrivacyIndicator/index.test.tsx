import { i18n, setupTestCatalog } from "../../test/i18n";
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import type { AccessLevels } from "../ApiTypes";
import { PrivacyIndicator, SpacePrivacyIndicator } from ".";

jest.mock("../Tooltip", () => ({
  Tooltip: ({
    children,
    testId,
    content,
  }: {
    children: React.ReactNode;
    content: React.ReactNode;
    testId?: string;
  }) => (
    <div data-testid={testId}>
      {children}
      {content}
    </div>
  ),
}));

jest.mock("../icons", () => ({
  IconWorld: ({ size }: { size: number }) => <span data-testid="world-icon">{`world-${size}`}</span>,
  IconLockFilled: ({ size, className }: { size: number; className?: string }) => (
    <span data-testid="lock-icon" className={className}>
      {`lock-${size}`}
    </span>
  ),
}));

function accessLevels(overrides: Partial<AccessLevels> = {}): AccessLevels {
  return {
    __typename: "access_levels",
    public: 0,
    company: 0,
    space: 70,
    ...overrides,
  };
}

describe("SpacePrivacyIndicator", () => {
  it("renders the public indicator when public access is greater than zero", () => {
    render(<SpacePrivacyIndicator accessLevels={accessLevels({ public: 10 })} iconSize={30} />);

    expect(screen.getByTestId("public-space-tooltip")).toBeInTheDocument();
    expect(screen.getByTestId("world-icon")).toHaveTextContent("world-30");
    expect(screen.queryByTestId("lock-icon")).not.toBeInTheDocument();
  });

  it("renders nothing when the space is company-visible", () => {
    const { container } = render(<SpacePrivacyIndicator accessLevels={accessLevels({ company: 10 })} iconSize={14} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the invite-only indicator when company and public access are zero", () => {
    render(<SpacePrivacyIndicator accessLevels={accessLevels({ public: 0, company: 0 })} iconSize={14} />);

    const indicator = screen.getByTestId("secret-space-tooltip");
    expect(indicator).toBeInTheDocument();
    expect(screen.getByTestId("lock-icon")).toHaveTextContent("lock-14");
    expect(screen.getByTestId("lock-icon")).not.toHaveClass("text-content-error");
  });

  it("renders nothing when access levels are missing", () => {
    const { container } = render(<SpacePrivacyIndicator accessLevels={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when access levels are undefined", () => {
    const { container } = render(<SpacePrivacyIndicator accessLevels={undefined} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("prefers public over company when both are set", () => {
    render(<SpacePrivacyIndicator accessLevels={accessLevels({ public: 10, company: 10 })} />);

    expect(screen.getByTestId("public-space-tooltip")).toBeInTheDocument();
    expect(screen.queryByTestId("secret-space-tooltip")).not.toBeInTheDocument();
  });
});

setupTestCatalog();

it.each(["goal", "project", "space"] as const)(
  "translates complete privacy sentences for a %s",
  async (resourceType) => {
    await i18n.changeLanguage("pt-BR");
    render(<PrivacyIndicator privacyLevel="confidential" resourceType={resourceType} spaceName="<R&D>" />);
    expect(screen.getByText("Somente membros de <R&D>")).toBeInTheDocument();
    expect(screen.getByText(/visível apenas para membros/)).toHaveTextContent("<R&D>");
  },
);
