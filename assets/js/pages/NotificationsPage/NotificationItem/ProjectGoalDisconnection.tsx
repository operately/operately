import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ({ notification }) {
  const author = notification.activity.author;
  const project = notification.activity.content.project;
  const projectName = notification.activity.content.project.name;
  const goalName = notification.activity.content.goal.name;
  const link = `/projects/${project.id}`;

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + ` disconnected the ${projectName} project from the ${goalName} goal`}
      author={author}
      link={link}
      where={projectName}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
