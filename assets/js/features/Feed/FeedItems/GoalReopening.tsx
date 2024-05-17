import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";
import { GoalLink } from "../shared/GoalLink";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import ActivityHandler from "@/features/activities";

export const GoalReopening: FeedItem = {
  typename: "ActivityContentGoalReopening",

  contentQuery: `
    goal {
      id
      name
    }
  `,

  component: ({ activity, content, page }) => {
    return (
      <Container
        title={<Title activity={activity} page={page} content={content} />}
        author={activity.author}
        time={activity.insertedAt}
        content={<ActivityHandler.FeedItemContent activity={activity} content={content} page={page} />}
      />
    );
  },
};

function Title({ activity, content, page }) {
  const activityPath = Paths.goalActivityPath(content.goal.id, activity.id);
  const activityLink = <Link to={activityPath}>reopened</Link>;

  return (
    <>
      {People.shortName(activity.author)} {activityLink} <GoalLink goal={content.goal} page={page} showOnGoalPage />
    </>
  );
}
