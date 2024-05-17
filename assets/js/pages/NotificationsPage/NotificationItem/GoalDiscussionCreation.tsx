import * as React from "react";

import { Card } from "../NotificationCard";
import { activityPagePath, NotificationTitle } from "@/features/activities";

export default function ({ notification }) {
  const author = notification.activity.author;
  const content = notification.activity.content;

  return (
    <Card
      testId="goal-discussion-creation"
      notification={notification}
      title={<NotificationTitle activity={notification.activity} />}
      author={author}
      link={activityPagePath(notification.activity)}
      where={content.goal.name}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
