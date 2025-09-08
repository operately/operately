import * as SaasAdminCompanyPage from "./SaasAdminCompanyPage";
import * as SaasAdminPage from "./SaasAdminPage";

export default {
  SaasAdminPage: {
    name: "SaasAdminPage",
    loader: SaasAdminPage.loader,
    Page: SaasAdminPage.Page,
  },

  SaasAdminCompanyPage: {
    name: "SaasAdminCompanyPage",
    loader: SaasAdminCompanyPage.loader,
    Page: SaasAdminCompanyPage.Page,
  },
};
