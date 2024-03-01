import * as React from "react";
import * as People from "@/models/people";
import * as Time from "@/utils/time";

import { Summary } from "@/components/RichContent";
import { Link } from "@/components/Link";
import { FeedItem, Container } from "../FeedItem";
import { Paths } from "@/routes/paths";

import FormattedTime from "@/components/FormattedTime";

export const GoalCheckIn: FeedItem = {
  typename: "ActivityContentGoalCheckIn",
  contentQuery: `
    update {
      id
      message
      insertedAt
    }

    goal {
      id
    }
  `,

  component: ({ activity, content }) => {
    const update = content.update;
    const goal = content.goal;

    const insertedAt = Time.parseISO(update.insertedAt);
    const time = <FormattedTime time={insertedAt} format="long-date" />;

    const path = Paths.goalCheckInPath(goal.id, update.id);
    const link = <Link to={path}>Check-In on {time}</Link>;

    const title = (
      <>
        {People.shortName(activity.author)} submitted: {link}
      </>
    );

    const summary = <Summary jsonContent={update.message} characterCount={200} />;

    return <Container title={title} author={activity.author} time={activity.insertedAt} content={summary} />;
  },
};
