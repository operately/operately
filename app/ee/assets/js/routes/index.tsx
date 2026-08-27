import React from "react";

import adminpages from "@/ee/pages";
import { pageRoute } from "@/routes/pageRoute";

import SaasAdminLayout from "@/ee/layouts/SaasAdminLayout";

function SaasAdminRoutes() {
  return <SaasAdminLayout />;
}

export function saasAdminRoutes() {
  return {
    path: "/admin",
    element: <SaasAdminRoutes />,
    children: [
      pageRoute("", adminpages.SaasAdminPage),
      pageRoute("email-settings", adminpages.SaasAdminEmailSettingsPage),
      pageRoute("update-badge", adminpages.SaasAdminUpdateBadgePage),
      pageRoute("billing-catalog", adminpages.SaasAdminBillingCatalogPage),
      pageRoute("site-messages", adminpages.SaasAdminSiteMessagesPage),
      pageRoute("search-index", adminpages.SaasAdminSearchIndexPage),
      pageRoute("companies/:companyId", adminpages.SaasAdminCompanyPage),
    ],
  };
}
