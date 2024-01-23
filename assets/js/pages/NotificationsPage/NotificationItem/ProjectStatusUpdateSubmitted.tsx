import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ProjectStatusUpdateSubmitted({ notification }) {
  const author = notification.activity.author;
  const projectName = notification.activity.content.project.name;
  const status = notification.activity.content.update.content.health.status;
  const link = `/projects/${notification.activity.content.projectId}/status_updates/${notification.activity.content.statusUpdateId}`;

  const action = status === "paused" ? " paused the project" : " submitted a status update";

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + action}
      author={author}
      link={link}
      where={projectName}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
