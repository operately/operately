import { LobbyPage } from "./index";

export const defaultCompanies: LobbyPage.Company[] = [
  { id: "company-1", name: "Acme Inc.", memberCount: 4, link: "/company-1" },
  { id: "company-2", name: "Nimbus Labs", memberCount: 1, link: "/company-2" },
];

export const defaultProps: LobbyPage.Props = {
  firstName: "Jane",
  companies: defaultCompanies,
  newCompanyPath: "/new",
  version: "v1.8",
  showCurrentVersion: true,
};
