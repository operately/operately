import * as React from "react";
import * as People from "@/models/people";

import { Container } from "../FeedItemElements";
import { Link } from "@/components/Link";
import { Summary } from "@/components/RichContent";

export default function ({ activity }) {
  const content = activity.content;
  const comment = content.comment;

  const title = <Title activity={activity} />;

  const commentMessage = comment.message;

  const summary = <Summary jsonContent={commentMessage} characterCount={200} />;

  return <Container title={title} author={activity.author} time={activity.insertedAt} content={summary} />;
}

function Title({ activity }) {
  const author = activity.author;
  const content = activity.content;

  const projectId = content.projectId;
  const milestone = content.milestone;

  const path = `/projects/${projectId}/milestones/${milestone.id}`;
  const link = <Link to={path}>{milestone.title}</Link>;
  const who = People.firstName(author);

  return (
    <>
      {who} {didWhat(content.commentAction)}: {link}
    </>
  );
}

function didWhat(action: string): string {
  switch (action) {
    case "none":
      return "commented on";
    case "complete":
      return "completed";
    case "reopen":
      return "re-opened";
    default:
      throw new Error("Unknown action: " + action);
  }
}
