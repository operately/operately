import React from "react";

import adminpages from "@/ee/pages";
import { pageRoute } from "@/routes/pageRoute";

import SaasAdminLayout from "@/ee/layouts/SaasAdminLayout";

function SaasAdminRoutes({children}) {
  return <SaasAdminLayout>{children}</SaasAdminLayout>
}

export function saasAdminRoutes() {
  return {
    path: "/admin",
    layout: SaasAdminRoutes,
    children: [
      pageRoute("", adminpages.SaasAdminPage),
      pageRoute("companies/:companyId", adminpages.SaasAdminCompanyPage),
    ],
  };
}
