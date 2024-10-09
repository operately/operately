import * as Pages from "@/components/Pages";
import * as Discussions from "@/models/discussions";
import * as Comments from "@/models/comments";

interface LoaderResult {
  discussion: Discussions.Discussion;
  comments: Comments.Comment[];
}

export async function loader({ params }): Promise<LoaderResult> {
  const [discussion, comments] = await Promise.all([
    Discussions.getDiscussion({
      id: params.id,
      includeAuthor: true,
      includeReactions: true,
      includeSpaceMembers: true,
      includeSubscriptionsList: true,
      includePotentialSubscribers: true,
      includeUnreadNotifications: true,
    }).then((d) => d.discussion!),
    Comments.getComments({
      entityId: params.id,
      entityType: "message",
    }).then((c) => c.comments!),
  ]);

  return {
    discussion,
    comments,
  };
}

export function useLoadedData(): LoaderResult {
  return Pages.useLoadedData() as LoaderResult;
}

export function useRefresh() {
  return Pages.useRefresh();
}
