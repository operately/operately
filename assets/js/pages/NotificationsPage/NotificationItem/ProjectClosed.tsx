import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ({ notification }) {
  const author = notification.activity.author;
  const projectName = notification.activity.content.project.name;
  const link = `/projects/${notification.activity.content.project.id}/retrospective`;

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " closed this project and submitted a retrospective"}
      author={author}
      link={link}
      where={projectName}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
