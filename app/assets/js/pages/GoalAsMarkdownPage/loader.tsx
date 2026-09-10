import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";

export async function loader({ params }) {
  const queryInput = {
    id: params.id,
    includeSpace: true,
    includeChampion: true,
    includeReviewer: true,
    includePermissions: true,
    includeUnreadNotifications: true,
    includeLastCheckIn: true,
    includeAccessLevels: true,
    includePrivacy: true,
    includeRetrospective: true,
    includeChecklist: true,
    includeProjects: true,
    includeMarkdown: true,
  };

  await Api.goals.getQuery(queryInput);
  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { markdown: string } {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useLoadedQuery(Api.goals.getQueryOptions(queryInput));

  if (data?.markdown == null) {
    throw new Error(`Markdown is unavailable for goal "${queryInput.id}"`);
  }

  return { markdown: data.markdown };
}
