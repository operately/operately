import { Activity } from "@/api";
import { TaskCreationActivity } from "turboui";
import { parsePersonForTurboUi } from "../people";
import { Paths } from "@/routes/paths";

const HANDLED_ACTIVITY_TYPES = ["task_adding"];

type TurboUiPerson = NonNullable<ReturnType<typeof parsePersonForTurboUi>>;

export function parseActivitiesForTurboUi(paths: Paths, activities: Activity[]) {
  return activities
    .filter((activity) => HANDLED_ACTIVITY_TYPES.includes(activity.action))
    .map((activity) => parseActivityForTurboUi(paths, activity))
    .filter((activity) => activity !== null);
}

function parseActivityForTurboUi(paths: Paths, activity: Activity) {
  const author = parsePersonForTurboUi(paths, activity.author);

  switch (activity.action) {
    case "task_adding":
      return parseTaskCreationActivity(author!, activity);
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
