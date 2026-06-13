import * as Comments from "@/models/comments";
import { SearchScope } from "@/models/people";
import { assertPresent } from "@/utils/assertions";

export function findMentionedScope(props: Comments.CommentableResource): SearchScope {
  switch (props.parentType) {
    case "message":
      assertPresent(props.discussion.space, "space must be present in discussion");
      return { type: "space", id: props.discussion.space.id! };
    case "project_check_in":
      assertPresent(props.checkIn?.project?.id, "project must be present in checkIn");
      return { type: "project", id: props.checkIn.project.id };
    case "project_retrospective":
      assertPresent(props.retrospective.project, "project must be present in retrospective");
      return { type: "project", id: props.retrospective.project.id! };
    case "resource_hub_document":
      assertPresent(props.document.resourceHub?.id, "resourceHub must be present in document");
      return { type: "resource_hub", id: props.document.resourceHub.id };
    case "resource_hub_file":
      assertPresent(props.file.resourceHub?.id, "resourceHub must be present in file");
      return { type: "resource_hub", id: props.file.resourceHub.id };
    case "resource_hub_link":
      assertPresent(props.link.resourceHub?.id, "resourceHub must be present in link");
      return { type: "resource_hub", id: props.link.resourceHub.id };
    case "goal_update":
      assertPresent(props.update?.goal?.id, "goal must be present in update");
      return { type: "goal", id: props.update.goal.id };
    case "project_discussion":
    case "goal_discussion":
      if (props.goal) {
        assertPresent(props.goal?.id, "Goal must be provided along with CommentThread");
        return { type: "goal", id: props.goal.id };
      }

      if (props.thread.project) {
        assertPresent(props.thread.project.id, "Project must be present in CommentThread");
        return { type: "project", id: props.thread.project.id };
      }

      throw new Error("CommentThread must have either goal or project defined");
  }
}
