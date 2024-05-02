import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";

export const GoalTimeframeEditing: FeedItem = {
  typename: "ActivityContentGoalTimeframeEditing",
  contentQuery: `
    goal {
      id
      name
    }

    oldTimeframe {
      startDate
      endDate
    }

    newTimeframe {
      startDate
      endDate
    }
  `,

  component: ({ activity, content, page }) => {
    return (
      <Container
        title={
          <>
            {People.shortName(activity.author)} edited the{" "}
            {page === "goal" ? (
              "goal"
            ) : (
              <>
                <Link to={Paths.goalPath(content.goal.id)}>{content.goal.name}</Link> goal
              </>
            )}
          </>
        }
        author={activity.author}
        time={activity.insertedAt}
        content={<Content activity={activity} />}
      />
    );
  },
};
