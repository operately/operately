import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";
import { createPath } from "@/utils/paths";

export default function ({ notification }) {
  const author = notification.activity.author;
  const title = notification.activity.content.title;
  const space = notification.activity.content.space;
  const id = notification.activity.content.discussionId;

  const path = createPath("spaces", space.id, "discussions", id);

  return (
    <Card
      notification={notification}
      title={People.firstName(author) + " posted: " + title}
      author={author}
      link={path}
      where={space.name}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}
