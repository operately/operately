import * as SaasAdminPage from "./SaasAdminPage";
import * as SaasAdminActiveCompaniesPage from "./SaasAdminActiveCompaniesPage";
import * as SaasAdminCompanyPage from "./SaasAdminCompanyPage";

export default {
  SaasAdminPage: {
    name: "SaasAdminPage",
    loader: SaasAdminPage.loader,
    Page: SaasAdminPage.Page,
  },

  SaasAdminActiveCompaniesPage: {
    name: "SaasAdminActiveCompaniesPage",
    loader: SaasAdminActiveCompaniesPage.loader,
    Page: SaasAdminActiveCompaniesPage.Page,
  },

  SaasAdminCompanyPage: {
    name: "SaasAdminCompanyPage",
    loader: SaasAdminCompanyPage.loader,
    Page: SaasAdminCompanyPage.Page,
  },
};
