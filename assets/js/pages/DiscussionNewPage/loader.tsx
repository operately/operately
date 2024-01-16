import * as Pages from "@/components/Pages";
import * as Groups from "@/models/groups";
import * as People from "@/models/people";

interface LoaderResult {
  space: Groups.Group;
  me: People.Person;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    space: await Groups.getGroup(params.spaceId),
    me: await People.getMe(),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
