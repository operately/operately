import React from "react";
import type Page from "@/features/Feed/index";

interface GoalLinkProps {
  goal: Goals.Goal;
  page: Page;
}

export function GoalLink(props: GoalLinkProps) {
  if (props.page === "goal") {
    return props.goal.name;
  }
  return <Link to={Paths.goalPath(props.goal.id)}>{props.goal.name}</Link>;
}
