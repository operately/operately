import * as Pages from "@/components/Pages";
import * as People from "@/models/people";
import { Paths } from "@/routes/paths";
import { redirectIfGuest } from "@/routes/redirectUtils";

interface LoaderResult {
  people: People.Person[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const paths = new Paths({ companyId: params.companyId! });
  await redirectIfGuest({ path: paths.homePath() });

  return {
    people: await People.getPeople({
      includeManager: true,
    }).then((data) => data.people!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
