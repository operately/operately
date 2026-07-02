import * as People from "@/models/people";
import * as React from "react";

import { Link } from "turboui";

import * as api from "@/api";
import { resourceHubLandingPath } from "@/models/resourceHubs/paths";

import { usePaths } from "@/routes/paths";

export const commentPath = (path: string, comment?: Pick<api.Comment, "id"> | null) => {
  return comment?.id ? `${path}#${comment.id}` : path;
};

export const commentedLink = (path: string, comment?: api.Comment | null) => {
  if (!comment?.id) return "commented";

  return <Link to={commentPath(path, comment)}>commented</Link>;
};

export const feedTitle = (activity: api.Activity, ...rest: (string | JSX.Element)[]) => {
  return (
    <>
      {People.firstName(activity.author!)}{" "}
      {rest.map((part, i) => (
        <React.Fragment key={i}>{part} </React.Fragment>
      ))}
    </>
  );
};

export const projectLink = (project: api.Project) => {
  const paths = usePaths();
  const path = paths.projectPath(project!.id!);
  const name = project!.name!;

  return <Link to={path}>{name}</Link>;
};

export const goalLink = (goal: api.Goal) => {
  const paths = usePaths();
  const path = paths.goalPath(goal.id);
  const name = goal.name;

  return <Link to={path}>{name}</Link>;
};

export const goalDocsAndFilesLink = (goal: api.Goal) => {
  const paths = usePaths();
  const path = paths.goalPath(goal.id, { tab: "docs-and-files" });
  const name = goal.name;

  return <Link to={path}>{name}</Link>;
};

export const goalCheckInLink = (checkIn?: api.GoalProgressUpdate | null) => {
  const paths = usePaths();

  if (!checkIn) {
    return "Check-In";
  }

  const path = paths.goalCheckInPath(checkIn.id);

  return <Link to={path}>Check-In</Link>;
};

export const projectCheckInLink = (checkIn?: api.ProjectCheckIn | null) => {
  const paths = usePaths();

  if (!checkIn?.id) {
    return "Check-In";
  }

  const path = paths.projectCheckInPath(checkIn.id);

  return <Link to={path}>Check-In</Link>;
};

export const spaceLink = (space: api.Space) => {
  const paths = usePaths();
  const path = paths.spacePath(space!.id!);
  const name = space!.name!;

  return <Link to={path}>{name}</Link>;
};

export const resourceHubLink = (
  hub: api.ResourceHub,
  opts?: { project?: api.Project | null; goal?: api.Goal | null },
) => {
  const paths = usePaths();
  const path = resourceHubLandingPath(paths, {
    ...hub,
    project: hub.project ?? opts?.project,
    goal: hub.goal ?? opts?.goal,
  });
  const name = hub.name!;

  return <Link to={path}>{name}</Link>;
};

export const documentLink = (document: api.ResourceHubDocument) => {
  const paths = usePaths();
  const path = paths.resourceHubDocumentPath(document.id!);
  const name = document.name;

  return <Link to={path}>{name}</Link>;
};

export const fileLink = (file: api.ResourceHubFile) => {
  const paths = usePaths();
  const path = paths.resourceHubFilePath(file.id!);
  const name = file.name!;

  return <Link to={path}>{name}</Link>;
};

export const folderLink = (folder: api.ResourceHubFolder) => {
  const paths = usePaths();
  const path = paths.resourceHubFolderPath(folder.id!);
  const name = folder.name!;

  return <Link to={path}>{name}</Link>;
};

export const linkLink = (link: api.ResourceHubLink) => {
  const paths = usePaths();
  const path = paths.resourceHubLinkPath(link.id!);
  const name = link.name!;

  return <Link to={path}>{name}</Link>;
};

export const milestoneLink = (milestone: api.Milestone, milestoneName?: string) => {
  const paths = usePaths();
  const path = paths.projectMilestonePath(milestone.id!);
  const name = milestoneName || milestone.title;

  return <Link to={path}>{name}</Link>;
};

export const milestoneCommentLink = (
  milestone: api.Milestone | null | undefined,
  comment: api.Comment | null | undefined,
) => {
  const paths = usePaths();

  if (!milestone?.id || !comment?.id) return <span>commented</span>;

  const path = commentPath(paths.projectMilestonePath(milestone.id), comment);

  return <Link to={path}>commented</Link>;
};

export const taskLink = (task: api.Task, attrs?: { taskName?: string; spaceId?: string }) => {
  const { taskName, spaceId } = attrs || {};
  const paths = usePaths();
  const path = spaceId ? paths.spaceKanbanPath(spaceId, { taskId: task.id }) : paths.taskPath(task.id);
  const name = taskName || task.name;

  return <Link to={path}>{name}</Link>;
};

export const personLink = (person: api.Person) => {
  const paths = usePaths();
  const path = paths.profilePath(person.id);

  return <Link to={path}>{person.fullName}</Link>;
};
