import React from "react";
import { Outlet } from "react-router";
import { RouteLanguageProvider } from "@/contexts/RouteLanguageProvider";

import adminpages from "@/ee/pages";
import { pageRoute } from "@/routes/pageRoute";

import SaasAdminLayout from "@/ee/layouts/SaasAdminLayout";

function SaasAdminRoutes() {
  return (
    <RouteLanguageProvider accountOnly>
      <Outlet />
    </RouteLanguageProvider>
  );
}

export function saasAdminRoutes() {
  return {
    path: "/admin",
    element: <SaasAdminRoutes />,
    children: [
      pageRoute("curated-templates/:templateId/preview", adminpages.SaasAdminCuratedTemplatePreviewPage),
      {
        element: <SaasAdminLayout />,
        children: [
          pageRoute("", adminpages.SaasAdminPage),
          pageRoute("email-settings", adminpages.SaasAdminEmailSettingsPage),
          pageRoute("update-badge", adminpages.SaasAdminUpdateBadgePage),
          pageRoute("billing-catalog", adminpages.SaasAdminBillingCatalogPage),
          pageRoute("curated-templates", adminpages.SaasAdminCuratedTemplatesPage),
          pageRoute("curated-templates/new", adminpages.SaasAdminCuratedTemplatePage),
          pageRoute("curated-templates/:templateId", adminpages.SaasAdminCuratedTemplatePage),
          pageRoute("site-messages", adminpages.SaasAdminSiteMessagesPage),
          pageRoute("search-index", adminpages.SaasAdminSearchIndexPage),
          pageRoute("companies/:companyId", adminpages.SaasAdminCompanyPage),
        ],
      },
    ],
  };
}
