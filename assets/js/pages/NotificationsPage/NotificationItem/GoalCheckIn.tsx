import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ({ notification }) {
  const author = notification.activity.author;
  const goal = notification.activity.content.goal;
  const update = notification.activity.content.update;
  const link = `/goals/${goal.id}/check-ins/${update.id}`;

  return (
    <Card
      testId="notification-check-in-submitted"
      notification={notification}
      title={People.firstName(author) + " submitted a check-in"}
      author={author}
      link={link}
      where={goal.name}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
