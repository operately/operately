import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Discussions from "@/models/discussions";

interface LoadedData {
  space: Spaces.Space;
  discussions: Discussions.Discussion[];
}

export async function loader({ params }): Promise<LoadedData> {
  const spacePromise = Spaces.getSpace({ id: params.id });
  const discussionsPromise = Discussions.getDiscussions({ spaceId: params.id }).then((data) => data.discussions!);

  return {
    space: await spacePromise,
    discussions: await discussionsPromise,
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
