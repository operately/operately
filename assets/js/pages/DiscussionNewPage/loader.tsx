import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as People from "@/models/people";

interface LoaderResult {
  space: Spaces.Space;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    space: await Spaces.getSpace({ id: params.id }),
    me: await People.getMe({}),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
