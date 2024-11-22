import * as SaasAdminPage from "./SaasAdminPage";
import * as SaasAdminCompanyPage from "./SaasAdminCompanyPage";

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
