import { useRouteLoaderData } from "react-router-dom";
import { CompanyLoadedData } from "./companyLoader";

export function useCompanyLoaderData() {
  return useRouteLoaderData("companyRoot") as CompanyLoadedData;
}
