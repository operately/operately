import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";

import { CompanyAdminPage } from "./index";
import { PRODUCT_RELEASES_PAGE_URL } from "../ProductReleaseAnnouncement/types";

const baseProps: CompanyAdminPage.Props = {
  companyName: "Acme Corp",
  admins: [],
  owners: [],
  isAdmin: true,
  isOwner: true,
  billingEnabled: true,
  canManageBilling: true,
  canEditDetails: true,
  canEditTrustedEmailDomains: true,
  homePath: "#",
  permissionsPath: "#",
  managePeoplePath: "#",
  restoreSuspendedPeoplePath: "#",
  billingPath: "#",
  renameCompanyPath: "#",
  manageAdminsPath: "#",
  trustedDomainsPath: "#",
  exportPath: "#",
  onDeleteCompany: async () => {},
};

function renderPage(props: Partial<CompanyAdminPage.Props> = {}) {
  return render(
    <MemoryRouter>
      <CompanyAdminPage {...baseProps} {...props} />
    </MemoryRouter>,
  );
}

describe("CompanyAdminPage", () => {
  it("links the current release to the public releases page", () => {
    renderPage({ currentRelease: { version: "v1.8", title: "MCP Connections, and more" } });

    const link = screen.getByRole("link", { name: /Operately v1\.8/ });

    expect(link).toHaveAttribute("href", PRODUCT_RELEASES_PAGE_URL);
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("MCP Connections, and more")).toBeInTheDocument();
  });

  it("omits the version section when there is no release to advertise", () => {
    renderPage({ currentRelease: null });

    expect(screen.queryByText("Version")).not.toBeInTheDocument();
  });
});
