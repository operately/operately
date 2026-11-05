import { reportQueryError } from "@/api/queryErrors";
import Api from "@/api";
import * as Socket from "@/api/socket";
import { companyLayoutInputs, prefetchCompanyLayout } from "@/models/companies/companyLayoutQueries";

import { checkAuth } from "@/routes/pageRoute";
import { idWithoutComments } from "@/routes/paths";

export type CompanyLoaderResult = Awaited<ReturnType<typeof companyLoader>>;

export async function companyLoader({ params }: { params: { companyId?: string } }) {
  checkAuth();

  // Renamed company URLs must share the same request and query-cache identity.
  const companyShortId = params.companyId ? idWithoutComments(params.companyId) : undefined;
  Api.default.setHeaders({ "x-company-id": companyShortId });
  Socket.setHeaders({ "x-company-id": companyShortId });

  try {
    const inputs = companyLayoutInputs();
    const companyId = await prefetchCompanyLayout(inputs);

    return { ...inputs, companyId };
  } catch (error) {
    reportQueryError(error);

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
