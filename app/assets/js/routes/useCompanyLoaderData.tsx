import { useRouteLoaderData } from "react-router";
import { CompanyLoadedData } from "./companyLoader";

export function useCompanyLoaderData() {
  return useRouteLoaderData("companyRoot") as CompanyLoadedData;
}
