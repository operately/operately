import * as SaasAdminBillingCatalogPage from "./SaasAdminBillingCatalogPage";
import * as SaasAdminCompanyPage from "./SaasAdminCompanyPage";
import * as SaasAdminEmailSettingsPage from "./SaasAdminEmailSettingsPage";
import * as SaasAdminPage from "./SaasAdminPage";
import * as SaasAdminSiteMessagesPage from "./SaasAdminSiteMessagesPage";
import * as SaasAdminSearchIndexPage from "./SaasAdminSearchIndexPage";
import * as SaasAdminUpdateBadgePage from "./SaasAdminUpdateBadgePage";

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

  SaasAdminEmailSettingsPage: {
    name: "SaasAdminEmailSettingsPage",
    loader: SaasAdminEmailSettingsPage.loader,
    Page: SaasAdminEmailSettingsPage.Page,
  },

  SaasAdminBillingCatalogPage: {
    name: "SaasAdminBillingCatalogPage",
    loader: SaasAdminBillingCatalogPage.loader,
    Page: SaasAdminBillingCatalogPage.Page,
  },

  SaasAdminSiteMessagesPage: {
    name: "SaasAdminSiteMessagesPage",
    loader: SaasAdminSiteMessagesPage.loader,
    Page: SaasAdminSiteMessagesPage.Page,
  },

  SaasAdminSearchIndexPage: {
    name: "SaasAdminSearchIndexPage",
    loader: SaasAdminSearchIndexPage.loader,
    Page: SaasAdminSearchIndexPage.Page,
  },

  SaasAdminUpdateBadgePage: {
    name: "SaasAdminUpdateBadgePage",
    loader: SaasAdminUpdateBadgePage.loader,
    Page: SaasAdminUpdateBadgePage.Page,
  },
};
