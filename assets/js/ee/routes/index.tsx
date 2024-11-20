import React from "react";

import adminpages from "@/ee/pages";
import { pageRoute } from "@/routes/pageRoute";
import { Outlet } from "react-router-dom";

function SaasAdminRoutes() {
  return <Outlet />;
}

export function saasAdminRoutes() {
  return {
    path: "/admin",
    element: <SaasAdminRoutes />,
    children: [pageRoute("", adminpages.SaasAdminPage)],
  };
}
