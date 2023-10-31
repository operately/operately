import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ProjectStatusUpdateSubmitted({ notification }) {
  const author = notification.activity.author;
  const projectName = notification.activity.content.project.name;
  const link = `/projects/${notification.activity.content.projectId}`;

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " changed the project timeline"}
      author={author}
      link={link}
      where={projectName}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
