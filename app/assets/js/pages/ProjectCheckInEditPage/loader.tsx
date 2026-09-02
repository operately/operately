import Api, { ProjectCheckIn } from "@/api";
import * as Pages from "@/components/Pages";
import { useQuery } from "@tanstack/react-query";

export async function loader({ params }) {
  const queryInput = {
    id: params.id,
    includeAuthor: true,
    includeProject: true,
    includeSpace: true,
    includeReactions: true,
    includePotentialSubscribers: true,
    includeSubscriptionsList: true,
  };

  await Api.projects.getCheckInQuery(queryInput);

  return { queryInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData(): { checkIn: ProjectCheckIn } {
  const { queryInput } = Pages.useLoadedData<LoaderResult>();
  const { data } = useQuery(Api.projects.getCheckInQueryOptions(queryInput));

  if (!data?.projectCheckIn) {
    throw new Error(`Check-in data is unavailable for check-in "${queryInput.id}"`);
  }

  return { checkIn: data.projectCheckIn };
}
