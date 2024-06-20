import * as Pages from "@/components/Pages";
import * as People from "@/models/people";

interface LoaderResult {
  people: People.Person[];
}

export async function loader(): Promise<LoaderResult> {
  return {
    people: await People.getPeople({}).then((data) => data.people!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
