import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";
import { createPath } from "@/utils/paths";

export default function ({ notification }) {
  const author = notification.activity.author;
  const goal = notification.activity.content.goal;

  const path = createPath("goals", goal.id);

  return (
    <Card
      notification={notification}
      title={title({ author, goal })}
      author={author}
      link={path}
      where={goal.name}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}

function title({ author, goal }) {
  return People.firstName(author) + " completed the " + goal.name + " goal";
}
