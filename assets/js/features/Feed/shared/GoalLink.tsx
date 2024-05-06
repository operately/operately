import * as React from "react";
import * as Goals from "@/models/goals";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";

interface GoalLinkProps {
  goal: Goals.Goal;
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
        {props.prefix} the <Link to={Paths.goalPath(props.goal.id)}>{props.goal.name}</Link> goal
      </>
    );
  }
}
