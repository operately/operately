import * as Pages from "@/components/Pages";
import * as Discussions from "@/models/discussions";

interface LoaderResult {
  discussion: Discussions.Discussion;
}

export async function loader({ params }): Promise<LoaderResult> {
  return {
    discussion: await Discussions.getDiscussion({
      id: params.id,
      includeAuthor: true,
      includeReactions: true,
      includeSpaceMembers: true,
      includeSubscriptionsList: true,
      includePotentialSubscribers: true,
      includeUnreadNotifications: true,
    }).then((d) => d.discussion!),
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
