import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";
import { Summary } from "@/components/RichContent";
import { Link } from "@/components/Link";
import { Paths } from "@/routes/paths";
import { GoalLink } from "../shared/GoalLink";

export const CommentAdded: FeedItem = {
  typename: "ActivityContentCommentAdded",
  contentQuery: `
    comment {
      content
    }

    activity {
      id

      content {
        __typename

        ... on ActivityContentGoalTimeframeEditing {
          goal {
            id
            name
          }
        }
      }
    }
  `,

  component: ({ activity, content, page }) => {
    const comment = content.comment;
    const commentContent = JSON.parse(comment.content)["message"];

    return (
      <Container
        title={<Title activity={activity} page={page} />}
        author={activity.author}
        time={activity.insertedAt}
        content={<Summary jsonContent={commentContent} characterCount={200} />}
      />
    );
  },
};

function Title({ activity, page }) {
  if (activity.content.activity) {
    const commentedActivity = activity.content.activity;

    switch (commentedActivity.content.__typename) {
      case "ActivityContentGoalTimeframeEditing":
        const goal = commentedActivity.content.goal;
        const path = Paths.goalActivityPath(goal.id, commentedActivity.id);

        return (
          <>
            {People.shortName(activity.author)} commented on the <Link to={path}>timeframe edit</Link>{" "}
            <GoalLink goal={goal} page={page} prefix={"for"} />
          </>
        );
      default:
        throw new Error("Unknown activity type " + activity.content.activity.content.__typename);
    }
  } else {
    throw new Error("Unknown source of comment");
  }
}
