import { loader, useLoadedData } from "./loader";
import * as React from "react";

import { BillingPickCompanyPage } from "turboui";
import { PageModule } from "@/routes/types";
import { Paths } from "@/routes/paths";

export default { name: "BillingPickCompanyPage", loader, Page } as PageModule;

function Page() {
  const { companies } = useLoadedData();
  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan");
  const billingPeriod = params.get("billing_period");

  const billingPath = (companyId: string) => {
    const paths = new Paths({ companyId });

    return plan || billingPeriod ? paths.companyBillingPlansPath({ plan, billingPeriod }) : paths.companyBillingPath();
  };

  return (
    <BillingPickCompanyPage companies={companies} plan={plan} billingPeriod={billingPeriod} billingPath={billingPath} />
  );
}
