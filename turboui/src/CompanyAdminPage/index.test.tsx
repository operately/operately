import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { createInstance } from "i18next";
import React from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";

import { CompanyAdminPage } from "./index";

const props: CompanyAdminPage.Props = {
  companyName: "Acme",
  admins: [],
  owners: [],
  isAdmin: true,
  isOwner: true,
  billingEnabled: false,
  canManageBilling: false,
  canEditDetails: true,
  canEditTrustedEmailDomains: true,
  homePath: "/home",
  permissionsPath: "/permissions",
  managePeoplePath: "/people",
  restoreSuspendedPeoplePath: "/restore",
  billingPath: "/billing",
  renameCompanyPath: "/rename",
  manageAdminsPath: "/admins",
  trustedDomainsPath: "/domains",
  exportPath: "/export",
  onDeleteCompany: jest.fn(),
};

it.each([
  ["Company Administration", "Manage team members", "Delete this company"],
  ["Administração da empresa", "Gerenciar membros da equipe", "Excluir esta empresa"],
])("uses catalog copy for company administration: %s", async (heading, managePeople, deleteCompany) => {
  const i18n = createInstance();
  await i18n.init({
    lng: "en",
    resources: {
      en: {
        translation: {
          "Company Administration": heading,
          "Manage team members": managePeople,
          "Delete this company": deleteCompany,
        },
      },
    },
  });

  render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter>
        <CompanyAdminPage {...props} />
      </MemoryRouter>
    </I18nextProvider>,
  );

  expect(screen.getByText(heading)).toBeInTheDocument();
  expect(screen.getByText(managePeople)).toBeInTheDocument();
  expect(screen.getByText(deleteCompany)).toBeInTheDocument();
});
