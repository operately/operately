import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = {
    id: params.id,
    includeSpace: true,
    includeGoal: true,
    includeChampion: true,
    includeReviewer: true,
    includePermissions: true,
    includeContributors: true,
    includeMilestones: true,
    includeLastCheckIn: true,
    includePrivacy: true,
    includeRetrospective: true,
    includeMarkdown: true,
  };

  await Api.projects.getQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { markdown: string } {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.projects.getQueryOptions(queryInput));

  if (!data?.markdown) {
    throw new Error(`Markdown is unavailable for project "${queryInput.id}"`);
  }

  return { markdown: data.markdown };
}
