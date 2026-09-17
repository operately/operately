import Api from "@/api";
import { useLoadedQuery } from "@/api/queryClient";
import * as Pages from "@/components/Pages";
import { prefetchPersonWithFallback } from "@/models/people/prefetchPersonWithFallback";
import { compareIds } from "@/routes/paths";

export type FromLocation = "admin-manage-people" | null;

export async function loader({ request, params }) {
  const personInput = { id: params.id, includeManager: true };
  const meInput = await prefetchPersonWithFallback(personInput, { includeManager: true });

  return { personInput, meInput, from: Pages.getSearchParam(request, "from") as FromLocation };
}

type LoaderResult = Awaited<ReturnType<typeof loader>>;

export function useLoadedData() {
  const { personInput, meInput, from } = Pages.useLoadedData<LoaderResult>();
  const { data: personData } = useLoadedQuery({
    ...Api.people.getQueryOptions(personInput),
    enabled: meInput === null,
  });
  const { data: meData } = useLoadedQuery({
    ...Api.people.getMeQueryOptions(meInput ?? { includeManager: true }),
    enabled: meInput !== null,
  });

  const person = meInput === null ? personData?.person : meData?.me;
  if (!person?.id || !compareIds(person.id, personInput.id)) throw new Error("Profile data is unavailable");

  return { person, from };
}
