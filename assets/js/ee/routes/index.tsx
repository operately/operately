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
    children: [pageRoute("", adminpages.SaasAdminPage)],
  };
}
