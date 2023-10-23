import * as React from "react";

import { Card } from "../NotificationCard";

import * as People from "@/models/people";

export default function ProjectCreated({ notification }) {
  const author = notification.activity.author;
  const project = notification.activity.content.project;

  const link = `/projects/${project.id}`;
  const myRole = project.myRole;

  return (
    <Card
      notification={notification}
      title={title({ author, myRole })}
      author={author}
      link={link}
      where={project.name}
      who={notification.activity.author.fullName}
      when={notification.activity.insertedAt}
    />
  );
}

function title({ author, myRole }) {
  var result = People.firstName(author) + " created a new project and";

  switch (myRole) {
    case "champion":
      result += " assigned you as the champion";
      break;
    case "reviewer":
      result += " assigned you as the reviewer";
      break;
    default:
      result += " assigned you as a contributor";
      break;
  }

  return result;
}
