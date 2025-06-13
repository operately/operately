import * as People from "@/models/people";
import * as React from "react";

import { DeprecatedPaths } from "@/routes/paths";
import { Link } from "turboui";

import * as api from "@/api";

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
  const path = DeprecatedPaths.projectPath(project!.id!);
  const name = project!.name!;

  return <Link to={path}>{name}</Link>;
};

export const goalLink = (goal: api.Goal) => {
  const path = DeprecatedPaths.goalPath(goal!.id!);
  const name = goal!.name!;

  return <Link to={path}>{name}</Link>;
};

export const spaceLink = (space: api.Space) => {
  const path = DeprecatedPaths.spacePath(space!.id!);
  const name = space!.name!;

  return <Link to={path}>{name}</Link>;
};

export const resourceHubLink = (hub: api.ResourceHub) => {
  const path = DeprecatedPaths.resourceHubPath(hub.id!);
  const name = hub.name!;

  return <Link to={path}>{name}</Link>;
};

export const documentLink = (document: api.ResourceHubDocument) => {
  const path = DeprecatedPaths.resourceHubDocumentPath(document.id!);
  const name = document.name!;

  return <Link to={path}>{name}</Link>;
};

export const fileLink = (file: api.ResourceHubFile) => {
  const path = DeprecatedPaths.resourceHubFilePath(file.id!);
  const name = file.name!;

  return <Link to={path}>{name}</Link>;
};

export const folderLink = (folder: api.ResourceHubFolder) => {
  const path = DeprecatedPaths.resourceHubFolderPath(folder.id!);
  const name = folder.name!;

  return <Link to={path}>{name}</Link>;
};

export const linkLink = (link: api.ResourceHubLink) => {
  const path = DeprecatedPaths.resourceHubLinkPath(link.id!);
  const name = link.name!;

  return <Link to={path}>{name}</Link>;
};
