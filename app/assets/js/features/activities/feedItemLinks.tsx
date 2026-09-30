import type { Paths } from "@/routes/paths";
import * as People from "@/models/people";
import * as React from "react";
import i18n from "@/i18n";

import { Link } from "turboui";

import * as api from "@/api";
import { resourceHubLandingPath } from "@/models/resourceHubs/paths";

export const commentPath = (path: string, comment?: Pick<api.Comment, "id"> | null) => {
  return comment?.id ? `${path}#${comment.id}` : path;
};

export const commentedLink = (path: string, comment?: api.Comment | null) => {
  if (!comment?.id) return i18n.t("commented");

  return <Link to={commentPath(path, comment)}>{i18n.t("commented")}</Link>;
};

export function activityPeopleNames(people: api.Person[]): string {
  const names = people.map(People.shortName);
  if (names.length < 2) return names[0] ?? "";
  return i18n.t("{{names}} and {{lastName}}", {
    names: names.slice(0, -1).join(", "),
    lastName: names[names.length - 1],
  });
}

export const activityAuthorName = (activity: api.Activity) => People.firstName(activity.author);

export const projectLink = (paths: Paths, project: api.Project) => {
  const path = paths.projectPath(project!.id!);
  const name = project!.name!;

  return <Link to={path}>{name}</Link>;
};

export const goalLink = (paths: Paths, goal: api.Goal) => {
  const path = paths.goalPath(goal.id);
  const name = goal.name;

  return <Link to={path}>{name}</Link>;
};

export const goalDocsAndFilesLink = (paths: Paths, goal: api.Goal) => {
  const path = paths.goalPath(goal.id, { tab: "docs-and-files" });
  const name = goal.name;

  return <Link to={path}>{name}</Link>;
};

export const goalCheckInLink = (paths: Paths, checkIn?: api.GoalProgressUpdate | null) => {
  if (!checkIn) {
    return i18n.t("Check-In");
  }

  const path = paths.goalCheckInPath(checkIn.id);

  return <Link to={path}>{i18n.t("Check-In")}</Link>;
};

export const projectCheckInLink = (paths: Paths, checkIn?: api.ProjectCheckIn | null) => {
  if (!checkIn?.id) {
    return i18n.t("Check-In");
  }

  const path = paths.projectCheckInPath(checkIn.id);

  return <Link to={path}>{i18n.t("Check-In")}</Link>;
};

export const spaceLink = (paths: Paths, space: api.Space) => {
  const path = paths.spacePath(space!.id!);
  const name = space!.name!;

  return <Link to={path}>{name}</Link>;
};

export const resourceHubLink = (
  paths: Paths,
  hub: api.ResourceHub,
  opts?: { project?: api.Project | null; goal?: api.Goal | null },
) => {
  const path = resourceHubLandingPath(paths, {
    ...hub,
    project: hub.project ?? opts?.project,
    goal: hub.goal ?? opts?.goal,
  });
  const name = hub.name!;

  return <Link to={path}>{name}</Link>;
};

export const documentLink = (paths: Paths, document: api.ResourceHubDocument) => {
  const path = paths.resourceHubDocumentPath(document.id!);
  const name = document.name;

  return <Link to={path}>{name}</Link>;
};

export const fileLink = (paths: Paths, file: api.ResourceHubFile) => {
  const path = paths.resourceHubFilePath(file.id!);
  const name = file.name!;

  return <Link to={path}>{name}</Link>;
};

export const folderLink = (paths: Paths, folder: api.ResourceHubFolder) => {
  const path = paths.resourceHubFolderPath(folder.id!);
  const name = folder.name!;

  return <Link to={path}>{name}</Link>;
};

export const linkLink = (paths: Paths, link: api.ResourceHubLink) => {
  const path = paths.resourceHubLinkPath(link.id!);
  const name = link.name!;

  return <Link to={path}>{name}</Link>;
};

export const milestoneLink = (paths: Paths, milestone: api.Milestone, milestoneName?: string) => {
  const path = paths.projectMilestonePath(milestone.id!);
  const name = milestoneName || milestone.title;

  return <Link to={path}>{name}</Link>;
};

export const milestoneCommentLink = (
  paths: Paths,
  milestone: api.Milestone | null | undefined,
  comment: api.Comment | null | undefined,
) => {
  if (!milestone?.id || !comment?.id) return <span>{i18n.t("commented")}</span>;

  const path = commentPath(paths.projectMilestonePath(milestone.id), comment);

  return <Link to={path}>{i18n.t("commented")}</Link>;
};

export const taskLink = (paths: Paths, task: api.Task, attrs?: { taskName?: string; spaceId?: string }) => {
  const { taskName, spaceId } = attrs || {};

  const path = spaceId ? paths.spaceKanbanPath(spaceId, { taskId: task.id }) : paths.taskPath(task.id);
  const name = taskName || task.name;

  return <Link to={path}>{name}</Link>;
};

export const personLink = (paths: Paths, person: api.Person) => {
  const path = paths.profilePath(person.id);

  return <Link to={path}>{person.fullName}</Link>;
};
