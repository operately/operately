import * as Pages from "@/components/Pages";
import * as Discussions from "@/models/discussions";

interface LoaderResult {
  discussion: Discussions.Discussion;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    discussion: await Discussions.getDiscussion({
      id: params.id,
      includeSpace: true,
    }).then((d) => d.discussion!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}
