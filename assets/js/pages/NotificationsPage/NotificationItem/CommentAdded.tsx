import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";
import { Paths } from "@/routes/paths";

export default function ({ notification }) {
  if (notification.activity.content.activity.content.__typename !== "ActivityContentGoalTimeframeEditing") {
    throw new Error(
      "CommentAdded notification received an unexpected activity type " + notification.activity.content.__typename,
    );
  }

  const author = notification.activity.author;
  const goal = notification.activity.content.activity.content.goal;
  const activityId = notification.activity.content.activity.id;

  const link = Paths.goalActivityPath(goal.id, activityId);

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " commented on the goal's timeframe change"}
      author={author}
      link={link}
      where={goal.name}
      who={author.fullName}
      when={notification.activity.insertedAt}
      testId="comment-added"
    />
  );
}
