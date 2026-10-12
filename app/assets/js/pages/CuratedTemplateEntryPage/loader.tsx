import { useMemo } from "react";
import { redirect } from "react-router";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { Paths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";

export async function loader({ params }: { params: { templateId: string } }) {
  const templateInput = { id: params.templateId };
  const companiesInput = {};
  const [, { companies }] = await Promise.all([
    Api.curated_templates.getQuery(templateInput),
    Api.companies.listQuery(companiesInput),
  ]);
  const entryPath = Paths.curatedTemplateEntryPath(params.templateId);

  if (companies.length === 0) return redirect(Paths.newCompanyPath({ redirectTo: entryPath }));
  const [company] = companies;
  if (companies.length === 1 && company) {
    return redirect(new Paths({ companyId: company.id }).curatedTemplateUsePath(params.templateId));
  }

  return { templateInput, companiesInput };
}

type LoaderResult = Exclude<Awaited<ReturnType<typeof loader>>, Response>;

export function useLoadedData() {
  const { templateInput, companiesInput } = Pages.useLoadedData<LoaderResult>();
  const templateOptions = useMemo(() => Api.curated_templates.getQueryOptions(templateInput), [templateInput]);
  const companyOptions = useMemo(() => Api.companies.listQueryOptions(companiesInput), [companiesInput]);
  const { data: templateData } = useLoadedQuery(templateOptions);
  const { data: companyData } = useLoadedQuery(companyOptions);

  assertPresent(templateData?.template, "Template unavailable");

  return { template: templateData.template, templateId: templateInput.id, companies: companyData?.companies ?? [] };
}
