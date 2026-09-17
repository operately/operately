import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const linkInput = {
    id: params.id,
    includePathToLink: true,
    includeResourceHub: true,
    includeGoal: true,
    includeSpace: true,
    includeProject: true,
  };

  await Api.links.getQuery(linkInput);

  return { linkInput };
}

export function useLoadedData() {
  const { linkInput } = Pages.useLoadedData<Awaited<ReturnType<typeof loader>>>();
  const { data } = useLoadedQuery(Api.links.getQueryOptions(linkInput));

  const link = data?.link;

  if (!link?.id) throw new Error("Link data is unavailable");
  if (!link.resourceHubId) throw new Error("Link resource hub is unavailable");

  return { link: { ...link, resourceHubId: link.resourceHubId } };
}
