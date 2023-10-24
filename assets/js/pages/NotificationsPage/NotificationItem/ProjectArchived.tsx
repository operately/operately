import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ProjectCreated({ notification }) {
  const author = notification.activity.author;
  const project = notification.activity.content.project;
  const link = `/projects/${project.id}`;

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " archived the " + project.name + " project where you were colaborating"}
      author={author}
      link={link}
      where={project.name}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
