import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ProjectReviewSubmitted({ notification }) {
  const author = notification.activity.author;
  const projectName = notification.activity.content.project.name;
  const link = `/projects/${notification.activity.content.project.id}/reviews/${notification.activity.content.reviewId}`;

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " submitted a review for " + projectName}
      author={author}
      link={link}
      where={projectName}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
