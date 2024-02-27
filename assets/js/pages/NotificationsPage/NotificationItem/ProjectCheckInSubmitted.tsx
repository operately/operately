import * as React from "react";
import * as People from "@/models/people";

import { Card } from "../NotificationCard";
import { Paths } from "@/routes/paths";

export default function ProjectCheckInSubmitted({ notification }) {
  const activity = notification.activity;
  const content = activity.content;
  const author = activity.author;
  const projectName = content.project.name;
  const link = Paths.projectCheckInPath(content.project.id, content.checkIn.id);

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " submitted a check-in"}
      author={author}
      link={link}
      where={projectName}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
