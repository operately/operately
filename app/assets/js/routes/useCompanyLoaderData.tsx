import type * as Companies from "@/models/companies";
import { useRouteLoaderData } from "react-router-dom";

type CompanyLoaderData = { company?: Companies.Company };

export function useCompanyLoaderData() {
  return useRouteLoaderData("companyRoot") as CompanyLoaderData | null;
}
