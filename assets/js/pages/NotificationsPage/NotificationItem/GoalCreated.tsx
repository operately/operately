import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";
import { createPath } from "@/utils/paths";

export default function ({ notification }) {
  const author = notification.activity.author;
  const goal = notification.activity.content.goal;

  const path = createPath("goals", goal.id);
  const myRole = goal.myRole;

  return (
    <Card
      notification={notification}
      title={title({ author, myRole })}
      author={author}
      link={path}
      where={goal.name}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}

function title({ author, myRole }) {
  var result = People.firstName(author) + " added a new goal and";

  switch (myRole) {
    case "champion":
      result += " assigned you as the champion";
      break;
    case "reviewer":
      result += " assigned you as the reviewer";
      break;
    default:
      result += " assigned you as a contributor";
      break;
  }

  return result;
}
