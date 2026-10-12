import { useMemo } from "react";
import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { assertPresent } from "@/utils/assertions";

export async function loader({ params }: { params: { templateId: string } }) {
  const templateInput = { id: params.templateId };
  const spacesInput = { query: "", accessLevel: "edit_access" as const };
  await Promise.all([Api.curated_templates.getQuery(templateInput), Api.spaces.searchQuery(spacesInput)]);

  return { templateInput, spacesInput };
}

export function useLoadedData() {
  const { templateInput, spacesInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const templateOptions = useMemo(() => Api.curated_templates.getQueryOptions(templateInput), [templateInput]);
  const spacesOptions = useMemo(() => Api.spaces.searchQueryOptions(spacesInput), [spacesInput]);
  const { data: templateData } = useLoadedQuery(templateOptions);
  const { data: spacesData } = useLoadedQuery(spacesOptions);

  assertPresent(templateData?.template, "Template unavailable");

  return { template: templateData.template, templateId: templateInput.id, spaces: spacesData?.spaces ?? [] };
}
