import { CommentThread } from "@/models/activities";
import { Discussion } from "@/models/discussions";
import { Update } from "@/models/goalCheckIns";
import { ProjectCheckIn } from "@/models/projectCheckIns";
import { ProjectRetrospective } from "@/models/projects";
import { ResourceHubDocument, ResourceHubFile, ResourceHubLink } from "@/models/resourceHubs";

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
  parentType: "comment_thread";
  goal?: { id: string };
  project?: { id: string };
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
