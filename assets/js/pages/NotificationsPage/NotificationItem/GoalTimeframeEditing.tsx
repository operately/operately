import * as React from "react";
import * as People from "@/models/people";

import { Card } from "../NotificationCard";
import { Paths } from "@/routes/paths";

export default function ({ notification }) {
  const author = notification.activity.author;
  const content = notification.activity.content;

  const path = Paths.goalPath(content.goal.id);

  return (
    <Card
      notification={notification}
      title={<>{People.firstName(author)} edited the goal's timeframe</>}
      author={author}
      link={path}
      where={content.goal.name}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
