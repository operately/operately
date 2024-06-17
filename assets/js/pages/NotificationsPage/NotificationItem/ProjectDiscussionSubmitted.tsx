import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ProjectDiscussionSubmitted({ notification }) {
  const author = notification.activity.author;
  const title = notification.activity.content.title;
  const projectName = notification.activity.content.project.name;
  const link = `/projects/${notification.activity.content.projectId}/discussions/${notification.activity.content.discussionId}`;

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " started a new discussion: " + title}
      author={author}
      link={link}
      where={projectName}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
