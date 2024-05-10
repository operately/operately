import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";
import { Paths } from "@/routes/paths";
import { match } from "ts-pattern";

const supported = ["ActivityContentGoalTimeframeEditing", "ActivityContentGoalClosing"];

export default function ({ notification }) {
  const typename = notification.activity.content.activity.content.__typename;

  checkSupported(typename);

  const author = notification.activity.author;
  const goal = notification.activity.content.activity.content.goal;
  const activityId = notification.activity.content.activity.id;

  const link = Paths.goalActivityPath(goal.id, activityId);

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " " + title(typename)}
      author={author}
      link={link}
      where={goal.name}
      who={author.fullName}
      when={notification.activity.insertedAt}
      testId="comment-added"
    />
  );
}

function title(typename: string) {
  return match(typename)
    .with("ActivityContentGoalTimeframeEditing", () => "commented on the goal's timeframe change")
    .with("ActivityContentGoalClosing", () => "commented on goal closing")
    .otherwise(() => {
      throw new Error(`Unsupported typename: ${typename}`);
    });
}

function checkSupported(typename: string) {
  if (!supported.includes(typename)) {
    throw new Error(`Unsupported typename: ${typename}`);
  }
}
