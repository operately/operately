import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ProjectDiscussionCommentSubmitted({ notification }) {
  const author = notification.activity.author;
  const title = notification.activity.content.discussionTitle;
  const projectName = notification.activity.content.project.name;
  const link = `/projects/${notification.activity.content.projectId}/discussions/${notification.activity.content.discussionId}`;

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " commented on: " + title}
      author={author}
      link={link}
      where={projectName}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
