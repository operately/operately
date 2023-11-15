import * as React from "react";

import { Card } from "../NotificationCard";
import * as People from "@/models/people";

export default function ({ notification }) {
  const author = notification.activity.author;
  const project = notification.activity.content.project;
  const link = `/projects/${project.id}`;

  const oldSpace = notification.activity.content.oldSpace.name;
  const newSpace = notification.activity.content.newSpace.name;

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " moved this project from " + oldSpace + " to " + newSpace}
      author={author}
      link={link}
      where={project.name}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
