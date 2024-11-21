import React from "react";

import adminpages from "@/ee/pages";
import { pageRoute } from "@/routes/pageRoute";
import NonCompanyLayout from "@/layouts/NonCompanyLayout";

function SaasAdminRoutes() {
  return <NonCompanyLayout />;
}

export function saasAdminRoutes() {
  return {
    path: "/admin",
    element: <SaasAdminRoutes />,
    children: [pageRoute("", adminpages.SaasAdminPage)],
  };
}
