import * as React from "react";
import * as Goals from "@/models/goals";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { Project } from "@/api";

import * as api from "@/api";

interface ProjectLinkProps {
  project: Project;
  page: string;
  prefix?: string;
  showOnProjectPage?: boolean;
}

export function ProjectLink(props: ProjectLinkProps) {
  if (props.page === "project") {
    if (props.showOnProjectPage) {
      return <>{props.prefix} this project</>;
    } else {
      return null;
    }
  } else {
    return (
      <>
        {props.prefix} the <Link to={Paths.projectPath(props.project!.id!)}>{props.project!.name!}</Link> project
      </>
    );
  }
}

interface GoalLinkProps {
  goal: Goals.Goal | api.Goal;
  page: string;
  prefix?: string;
  showOnGoalPage?: boolean;
}

export function GoalLink(props: GoalLinkProps) {
  if (props.page === "goal") {
    if (props.showOnGoalPage) {
      return <>{props.prefix} this goal</>;
    } else {
      return null;
    }
  } else {
    return (
      <>
        {props.prefix} the <Link to={Paths.goalPath(props.goal!.id!)}>{props.goal!.name!}</Link> goal
      </>
    );
  }
}

interface SpaceLinkProps {
  space: api.Group;
  page: string;
  prefix?: string;
  showOnSpacePage?: boolean;
}

export function SpaceLink(props: SpaceLinkProps) {
  if (props.page === "space") {
    if (props.showOnSpacePage) {
      return <>{props.prefix} this space</>;
    } else {
      return null;
    }
  } else {
    return (
      <>
        {props.prefix} the <Link to={Paths.spacePath(props.space!.id!)}>{props.space!.name!}</Link> space
      </>
    );
  }
}
