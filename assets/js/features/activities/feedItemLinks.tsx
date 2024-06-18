import * as React from "react";
import * as People from "@/models/people";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";

import * as api from "@/api";

export const feedTitle = (activity: api.Activity, ...rest: (string | JSX.Element)[]) => {
  return (
    <>
      {People.shortName(activity.author!)}{" "}
      {rest.map((part, i) => (
        <React.Fragment key={i}>{part} </React.Fragment>
      ))}
    </>
  );
};

export const projectLink = (project: api.Project) => {
  const path = Paths.projectPath(project!.id!);
  const name = project!.name!;

  return <Link to={path}>{name}</Link>;
};

export const goalLink = (goal: api.Goal) => {
  const path = Paths.goalPath(goal!.id!);
  const name = goal!.name!;

  return <Link to={path}>{name}</Link>;
};

export const spaceLink = (space: api.Space) => {
  const path = Paths.spacePath(space!.id!);
  const name = space!.name!;

  return <Link to={path}>{name}</Link>;
};
