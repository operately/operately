import { ResourceHubDocument, ResourceHubFile, ResourceHubLink } from "@/models/resourceHubs";
import { ProjectCheckIn } from "@/models/projectCheckIns";
import { ProjectRetrospective } from "@/models/projects";
import { Update } from "@/models/goalCheckIns";
import { Goal } from "@/models/goals";
import { Discussion } from "@/models/discussions";
import { CommentThread } from "@/models/activities";

interface ParentDiscussion {
  discussion: Discussion;
  parentType: "message";
}

interface ParentProjectCheckIn {
  checkIn: ProjectCheckIn;
  parentType: "project_check_in";
}

interface ParentProjectRetrospective {
  retrospective: ProjectRetrospective;
  parentType: "project_retrospective";
}

interface ParentResourceHubDocument {
  document: ResourceHubDocument;
  parentType: "resource_hub_document";
}

interface ParentResourceHubFile {
  file: ResourceHubFile;
  parentType: "resource_hub_file";
}

interface ParentResourceHubLink {
  link: ResourceHubLink;
  parentType: "resource_hub_link";
}

interface ParentGoalUpdate {
  update: Update;
  parentType: "goal_update";
}

interface ParentCommentThread {
  thread: CommentThread;
  goal: Goal;
  parentType: "comment_thread";
}

export type CommentableResource =
  | ParentDiscussion
  | ParentProjectCheckIn
  | ParentProjectRetrospective
  | ParentResourceHubDocument
  | ParentResourceHubFile
  | ParentResourceHubLink
  | ParentGoalUpdate
  | ParentCommentThread;
