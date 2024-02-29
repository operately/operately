import * as React from "react";
import * as People from "@/models/people";

import { Card } from "../NotificationCard";
import { Paths } from "@/routes/paths";

export default function ({ notification }) {
  const author = notification.activity.author;
  const project = notification.activity.content.project;
  const link = Paths.projectPath(project.id);

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " paused the project"}
      author={author}
      link={link}
      where={project.name}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
