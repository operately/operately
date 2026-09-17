import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { prefetchPersonWithFallback } from "@/models/people/prefetchPersonWithFallback";
import { compareIds } from "@/routes/paths";

export async function loader({ params }) {
  const personInput = {
    id: params.id,
    includeManager: true,
    includeReports: true,
    includePeers: true,
    includePermissions: true,
  };

  const workMapInput = { championId: params.id, contributorId: params.id, includeReviewer: true, includeTasks: true };
  const reviewerWorkMapInput = { reviewerId: params.id, includeReviewer: true };

  const [meInput] = await Promise.all([
    prefetchPersonWithFallback(personInput),
    Api.companies.getFlatWorkMapQuery(workMapInput),
    Api.companies.getFlatWorkMapQuery(reviewerWorkMapInput),
  ]);

  return { personInput, meInput, workMapInput, reviewerWorkMapInput };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { personInput, meInput, workMapInput, reviewerWorkMapInput } = Pages.useLoadedData<LoaderResult>();
  const { data: personData } = useLoadedQuery({
    ...Api.people.getQueryOptions(personInput),
    enabled: meInput === null,
  });
  const { data: meData } = useLoadedQuery({
    ...Api.people.getMeQueryOptions(meInput ?? {}),
    enabled: meInput !== null,
  });
  const { data: workMapData } = useLoadedQuery(Api.companies.getFlatWorkMapQueryOptions(workMapInput));
  const { data: reviewerWorkMapData } = useLoadedQuery(Api.companies.getFlatWorkMapQueryOptions(reviewerWorkMapInput));
  const person = meInput === null ? personData?.person : meData?.me;

  if (!person?.id || !compareIds(person.id, personInput.id)) throw new Error("Profile data is unavailable");
  if (!workMapData?.workMap || !reviewerWorkMapData?.workMap) throw new Error("Profile work map data is unavailable");

  return { person, workMap: workMapData.workMap, reviewerWorkMap: reviewerWorkMapData.workMap };
}
