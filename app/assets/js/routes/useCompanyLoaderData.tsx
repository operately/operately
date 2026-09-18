import { useRouteLoaderData } from "react-router";
import { useCompanyLayoutQueries, useRefreshCompanyLayout } from "@/models/companies/companyLayoutQueries";
import type { CompanyLoaderResult } from "./companyLoader";

export function useCompanyLoaderData() {
  const inputs = useRouteLoaderData("companyRoot") as CompanyLoaderResult;

  return useCompanyLayoutQueries(inputs);
}

export function useRefreshCompanyLoader() {
  const inputs = useRouteLoaderData("companyRoot") as CompanyLoaderResult;

  return useRefreshCompanyLayout(inputs);
}
