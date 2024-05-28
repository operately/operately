import * as React from "react";
import * as People from "@/models/people";
import * as Time from "@/utils/time";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { FeedItem, Container } from "../FeedItem";

import FormattedTime from "@/components/FormattedTime";

export const GoalCheckInAcknowledgement: FeedItem = {
  typename: "ActivityContentGoalCheckInAcknowledgement",

  contentQuery: `
    update {
      id
      insertedAt
    }

    goal {
      id
      name
    }
  `,

  component: ({ activity, content, page }) => {
    const update = content.update;
    const goal = content.goal;

    const insertedAt = Time.parseISO(update.insertedAt);
    const time = <FormattedTime timezone={""} time={insertedAt} format="long-date" />;

    const path = Paths.goalProgressUpdatePath(goal.id, update.id);
    const link = <Link to={path}>Progress Update from {time}</Link>;
    const goalPath = Paths.goalPath(goal.id);

    const title = (
      <>
        {People.shortName(activity.author)} acknowledged: {link}{" "}
        {page !== "goal" && (
          <>
            for the <Link to={goalPath}>{goal.name}</Link> goal
          </>
        )}
      </>
    );

    return <Container title={title} author={activity.author} time={activity.insertedAt} />;
  },
};
