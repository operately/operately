import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ProjectMilestoneCommented({ notification }) {
  const author = notification.activity.author;
  const projectName = notification.activity.content.project.name;
  const link = `/projects/${notification.activity.content.project.id}/milestones/${notification.activity.content.milestone.id}`;
  const action = notification.activity.content.commentAction;

  return (
    <Card
      notification={notification}
      title={<Title author={author} action={action} title={notification.activity.content.milestone.title} />}
      author={author}
      link={link}
      where={projectName}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}

function Title({ author, action, title }) {
  switch (action) {
    case "none":
      return <>{People.firstName(author) + " commented on: " + title}</>;
    case "complete":
      return <>{People.firstName(author) + " completed: " + title}</>;
    case "reopen":
      return <>{People.firstName(author) + " re-opened: " + title}</>;
    default:
      throw new Error("Unknown action: " + action);
  }
}
