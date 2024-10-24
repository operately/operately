import * as Pages from "@/components/Pages";
import * as Spaces from "@/models/spaces";
import * as Discussions from "@/models/discussions";

interface LoadedData {
  space: Spaces.Space;
  discussions: Discussions.Discussion[];
}

export async function loader({ params }): Promise<LoadedData> {
  const [space, discussions] = await Promise.all([
    Spaces.getSpace({ id: params.id, includePermissions: true }),
    Discussions.getDiscussions({ spaceId: params.id, includeAuthor: true }).then((data) => data.discussions!),
  ]);

  return {
    space,
    discussions,
  };
}

export function useLoadedData(): LoadedData {
  return Pages.useLoadedData() as LoadedData;
}
