import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Discussions from "@/models/discussions";

interface LoadedData {
  space: Spaces.Space;
  discussions: Discussions.Discussion[];
  myDrafts: Discussions.Discussion[];
}

export async function loader({ params }): Promise<LoadedData> {
  const [space, discussions, myDrafts] = await Promise.all([
    Spaces.getSpace({ id: params.id, includePermissions: true }),
    Discussions.getDiscussions({ spaceId: params.id, includeAuthor: true, includeMyDrafts: true }).then((data) => [
      data.discussions!,
      data.myDrafts!,
    ]),
  ]);

  return {
    space,
    discussions,
    myDrafts,
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
