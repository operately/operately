import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ProjectRenamed({ notification }) {
  const author = notification.activity.author;
  const project = notification.activity.content.project;
  const link = `/projects/${project.id}`;

  const oldName = notification.activity.content.oldName;
  const newName = notification.activity.content.newName;

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " renamed " + oldName + " to " + newName}
      author={author}
      link={link}
      where={project.name}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
