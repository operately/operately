import * as Pages from "@/components/Pages";
import * as Activities from "@/models/activities";
import * as Projects from "@/models/projects";
import { isSubscribedToResource } from "@/models/subscriptions";

interface LoaderResult {
  activity: Activities.Activity;
  project: Projects.Project;
  isCurrentUserSubscribed: boolean;
}

export async function loader({ params }): Promise<LoaderResult> {
  const activity = await Activities.getActivity({
    id: params.id,
    includeUnreadProjectNotifications: true,
    includePermissions: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
  });
  const project = Activities.getProject(activity);

  const commentThreadId = activity.commentThread?.id;
  const isCurrentUserSubscribed = commentThreadId
    ? (await isSubscribedToResource({ resourceId: commentThreadId, resourceType: "comment_thread" })).subscribed
    : false;

  try {
    return {
      activity,
      project: await Projects.getProject({ id: project.id, includeSpace: true, includePermissions: true }).then(
        (data) => data.project,
      ),
      isCurrentUserSubscribed,
    };
  } catch (e) {
    return { activity, project, isCurrentUserSubscribed };
  }
}

export function useLoaderData() {
  return Pages.useLoadedData<LoaderResult>();
}
