import * as People from "@/models/people";
import * as React from "react";

import { Link } from "turboui";

import * as api from "@/api";

import { usePaths } from "@/routes/paths";
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
  const path = paths.goalPath(goal!.id!);
  const name = goal!.name!;

  return <Link to={path}>{name}</Link>;
};

export const spaceLink = (space: api.Space) => {
  const paths = usePaths();
  const path = paths.spacePath(space!.id!);
  const name = space!.name!;

  return <Link to={path}>{name}</Link>;
};

export const resourceHubLink = (hub: api.ResourceHub) => {
  const paths = usePaths();
  const path = paths.resourceHubPath(hub.id!);
  const name = hub.name!;

  return <Link to={path}>{name}</Link>;
};

export const documentLink = (document: api.ResourceHubDocument) => {
  const paths = usePaths();
  const path = paths.resourceHubDocumentPath(document.id!);
  const name = document.name!;

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

export const milestoneLink = (milestone: api.Milestone) => {
  const paths = usePaths();
  const path = paths.projectMilestonePath(milestone.id!);
  const name = milestone.title;

  return <Link to={path}>{name}</Link>;
};

export const taskLink = (task: api.Task, taskName?: string) => {
  const paths = usePaths();
  const path = paths.taskPath(task.id);
  const name = taskName || task.name;

  return <Link to={path}>{name}</Link>;
};
