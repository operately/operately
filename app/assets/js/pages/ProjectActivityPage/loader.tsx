import * as Pages from "@/components/Pages";
import * as Activities from "@/models/activities";
import * as Projects from "@/models/projects";

interface LoaderResult {
  activity: Activities.Activity;
  project: Projects.Project;
}

export async function loader({ params }): Promise<LoaderResult> {
  const activity = await Activities.getActivity({
    id: params.id,
    includeUnreadProjectNotifications: true,
    includePermissions: true,
    includeSubscriptionsList: true,
    includePotentialSubscribers: true,
  });
  let project = Activities.getProject(activity);

  try {
    return {
      activity,
      project: await Projects.getProject({ id: project.id, includeSpace: true, includePermissions: true }).then(
        (data) => data.project,
      ),
    };
  } catch (e) {
    return { activity, project };
  }
}

export function useLoaderData() {
  return Pages.useLoadedData<LoaderResult>();
}
