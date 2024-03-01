import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";
import { Paths } from "@/routes/paths";

export default function ({ notification }) {
  const author = notification.activity.author;
  const project = notification.activity.content.project;

  const projectId = notification.activity.content.projectId;
  const checkInId = notification.activity.content.checkInId;

  const link = Paths.projectCheckInPath(projectId, checkInId);

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " commented on the project check-in"}
      author={author}
      link={link}
      where={project.name}
      who={author.fullName}
      when={notification.activity.insertedAt}
      testId="project-check-in-commented"
    />
  );
}
