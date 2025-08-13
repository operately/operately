import * as Companies from "@/models/companies";
import React from "react";
import { useCurrentCompany } from "../../contexts/CurrentCompanyContext";

interface AiSidebarContext {
  enabled: boolean;
}

const AiSidebarContext = React.createContext<AiSidebarContext>({
  enabled: false,
});

export function AiSidebarContextProvider({ children }: { children: React.ReactNode }) {
  const company = useCurrentCompany();
  const enabled = company !== null && Companies.hasFeature(company, "ai");

  return <AiSidebarContext.Provider value={{ enabled }}>{children}</AiSidebarContext.Provider>;
}
