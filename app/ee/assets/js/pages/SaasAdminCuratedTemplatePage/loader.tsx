import AdminApi from "@/ee/admin_api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }: { params: { templateId?: string } }) {
  const queryInput = params.templateId ? { id: params.templateId } : null;
  if (queryInput) await AdminApi.curated_templates.getQuery(queryInput);
  return { queryInput };
}

export function useLoadedData() {
  const { queryInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery({
    ...AdminApi.curated_templates.getQueryOptions(queryInput ?? { id: "" }),
    enabled: queryInput !== null,
  });
  return { template: queryInput ? data?.template : undefined };
}
