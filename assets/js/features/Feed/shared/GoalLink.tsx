import * as React from "react";
import * as Goals from "@/models/goals";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";

interface GoalLinkProps {
  goal: Goals.Goal;
  page: string;
}

export function GoalLink(props: GoalLinkProps) {
  if (props.page === "goal") {
    return "this goal";
  } else {
    return (
      <>
        the <Link to={Paths.goalPath(props.goal.id)}>{props.goal.name}</Link> goal
      </>
    );
  }
}
