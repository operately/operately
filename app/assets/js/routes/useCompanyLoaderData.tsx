import { useRouteLoaderData } from "react-router";
import {
  useCompanyLayoutQueries,
  useCompanyLayoutState,
  useRefreshCompanyLayout,
} from "@/models/companies/companyLayoutQueries";
import type { CompanyLoaderResult } from "./companyLoader";
import React from "react";
import { ContentListSkeleton } from "turboui";

export function CompanyDataBoundary({ children }: React.PropsWithChildren) {
  const inputs = useRouteLoaderData("companyRoot") as CompanyLoaderResult;
  const companyLayout = useCompanyLayoutState(inputs);
  if (!companyLayout) return <ContentListSkeleton />;

  return <>{children}</>;
}

export function useCompanyLoaderData() {
  const inputs = useRouteLoaderData("companyRoot") as CompanyLoaderResult;
  return useCompanyLayoutQueries(inputs);
}

export function useRefreshCompanyLoader() {
  const inputs = useRouteLoaderData("companyRoot") as CompanyLoaderResult;

  return useRefreshCompanyLayout(inputs);
}
