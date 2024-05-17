import * as React from "react";
import * as People from "@/models/people";

import { Card } from "../NotificationCard";
import ActivityHandler from "@/features/activities";

export default function ({ notification }) {
  const author = notification.activity.author;
  const goal = notification.activity.content.activity.content.goal;
  const parentActivity = notification.activity.content.activity;

  return (
    <Card
      notification={notification}
      title={<Title author={author} parentActivity={parentActivity} />}
      author={author}
      link={ActivityHandler.pagePath(parentActivity)}
      where={goal.name}
      who={author.fullName}
      when={notification.activity.insertedAt}
      testId="comment-added"
    />
  );
}

function Title({ author, parentActivity }) {
  return (
    <>
      {People.firstName(author)} <ActivityHandler.CommentNotificationTitle activity={parentActivity} />
    </>
  );
}
