import * as React from "react";

import { Card } from "./Card";

import * as People from "@/models/people";

export function ProjectDiscussionSubmittedNotification({ notification }) {
  const author = notification.activity.author;
  const title = notification.activity.content.title;
  const projectName = notification.activity.content.project.name;
  const link = `/projects/${notification.activity.content.projectId}/discussions/${notification.activity.content.discussionId}`;

  return (
    <Card
      title={People.firstName(author) + " started a new discussion: " + title}
      author={author}
      link={link}
      where={projectName}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
