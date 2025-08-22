import { Activity, ActivityContentTaskNameUpdating } from "@/api";
import { TaskCreationActivity, TaskTitleActivity, TaskDescriptionActivity } from "turboui";
import { parsePersonForTurboUi } from "../people";
import { Paths } from "@/routes/paths";

export const SUPPORTED_ACTIVITY_TYPES = ["task_adding", "task_name_updating", "task_description_change"];

type TurboUiPerson = NonNullable<ReturnType<typeof parsePersonForTurboUi>>;

export function parseActivitiesForTurboUi(paths: Paths, activities: Activity[]) {
  return activities
    .filter((activity) => SUPPORTED_ACTIVITY_TYPES.includes(activity.action))
    .map((activity) => parseActivityForTurboUi(paths, activity))
    .filter((activity) => activity !== null);
}

function parseActivityForTurboUi(paths: Paths, activity: Activity) {
  const author = parsePersonForTurboUi(paths, activity.author);

  switch (activity.action) {
    case "task_adding":
      return parseTaskCreationActivity(author!, activity);
    case "task_name_updating":
      return parseTaskNameUpdatingActivity(author!, activity, activity.content as ActivityContentTaskNameUpdating);
    case "task_description_change":
      return parseTaskDescriptionChangeActivity(
        author!,
        activity,
      );
    default:
      return null;
  }
}

function parseTaskCreationActivity(author: TurboUiPerson, activity: Activity): TaskCreationActivity {
  return {
    id: activity.id,
    type: "task_adding",
    author,
    insertedAt: activity.insertedAt,
  };
}

function parseTaskNameUpdatingActivity(
  author: TurboUiPerson,
  activity: Activity,
  content: ActivityContentTaskNameUpdating,
): TaskTitleActivity {
  return {
    id: activity.id,
    type: "task_name_updating",
    author,
    insertedAt: activity.insertedAt,
    fromTitle: content.oldName,
    toTitle: content.newName,
  };
}

function parseTaskDescriptionChangeActivity(
  author: TurboUiPerson,
  activity: Activity,
): TaskDescriptionActivity {
  return {
    id: activity.id,
    type: "task_description_change",
    author,
    insertedAt: activity.insertedAt,
    hasContent: true,
  };
}
