import * as Pages from "@/components/Pages";
import * as People from "@/models/people";

interface LoaderResult {
  person: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    person: await People.getPerson({ id: params.id }),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
