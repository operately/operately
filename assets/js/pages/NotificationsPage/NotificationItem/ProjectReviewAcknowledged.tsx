import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ProjectReviewAcknowledged({ notification }) {
  const author = notification.activity.author;
  const projectName = notification.activity.content.project.name;
  const link = `/projects/${notification.activity.content.projectId}/reviews/${notification.activity.content.reviewId}`;

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " acknowledged your review"}
      author={author}
      link={link}
      where={projectName}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
