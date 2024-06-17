import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";
import { Paths } from "@/routes/paths";

export default function ProjectCheckInAcknowledged({ notification }) {
  const activity = notification.activity;
  const author = activity.author;
  const project = activity.content.project;
  const link = Paths.projectCheckInPath(project.id, activity.content.checkInId);

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " acknowledged your check-in"}
      author={author}
      link={link}
      where={project.name}
      who={author.fullName}
      when={activity.insertedAt}
    />
  );
}
