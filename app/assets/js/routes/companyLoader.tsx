import Api from "@/api";
import * as Socket from "@/api/socket";
import { companyLayoutInputs, prefetchCompanyLayout } from "@/models/companies/companyLayoutQueries";

import { checkAuth } from "@/routes/pageRoute";

export type CompanyLoaderResult = Awaited<ReturnType<typeof companyLoader>>;

export async function companyLoader({ params }: { params: { companyId?: string } }) {
  checkAuth();

  Api.default.setHeaders({ "x-company-id": params.companyId });
  Socket.setHeaders({ "x-company-id": params.companyId });

  try {
    const inputs = companyLayoutInputs();
    const companyId = await prefetchCompanyLayout(inputs);

    return { ...inputs, companyId };
  } catch (error) {
    // If the company ID is invalid, the API will return a 400 message, but for the rest of the application, we can treat it as 404.
    if (
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      (error as { status: unknown }).status === 400
    ) {
      (error as { status: number }).status = 404;
    }

    throw error;
  }
}
