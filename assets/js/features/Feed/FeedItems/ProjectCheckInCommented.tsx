import * as React from "react";
import * as People from "@/models/people";

import FormattedTime from "@/components/FormattedTime";

import { FeedItem, Container } from "../FeedItem";
import { Link } from "@/components/Link";
import { Summary } from "@/components/RichContent";

import * as Time from "@/utils/time";
import { Paths } from "@/routes/paths";

export const ProjectCheckInCommented: FeedItem = {
  typename: "ActivityContentProjectCheckInCommented",
  contentQuery: `
    comment {
      content
    }
    checkIn {
      id
      insertedAt
    }
    project {
      id
      name
    }
  `,

  component: ({ activity, content, page }) => {
    const comment = content.comment;
    const commentContent = JSON.parse(comment.content)["message"];
    const project = content.project;

    const insertedAt = Time.parseISO(activity.insertedAt);
    const time = <FormattedTime time={insertedAt} format="long-date" />;

    const path = Paths.projectCheckInPath(project.id, content.checkIn.id);
    const link = <Link to={path}>Check-In on {time}</Link>;
    const title = (
      <>
        {People.shortName(activity.author)} commented on {link}
        {page !== "project" && (
          <>
            {" "}
            from the <Link to={Paths.projectPath(project.id)}>{project.name}</Link> project
          </>
        )}
      </>
    );

    const summary = <Summary jsonContent={commentContent} characterCount={200} />;

    return <Container title={title} author={activity.author} time={activity.insertedAt} content={summary} />;
  },
};
