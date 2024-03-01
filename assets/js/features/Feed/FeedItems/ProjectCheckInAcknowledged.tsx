import * as React from "react";
import * as People from "@/models/people";
import * as Time from "@/utils/time";
import * as Icons from "@tabler/icons-react";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { FeedItem, Container } from "../FeedItem";

import FormattedTime from "@/components/FormattedTime";

export const ProjectCheckInAcknowledged: FeedItem = {
  typename: "ActivityContentProjectCheckInAcknowledged",

  contentQuery: `
    projectId
    checkInId
  `,

  component: ({ activity, content }) => {
    const title = (
      <Title
        projectId={content.projectId}
        checkInId={content.checkInId}
        insertedAt={Time.parseISO(activity.insertedAt)}
        author={activity.author}
      />
    );

    return <Container title={title} author={activity.author} time={activity.insertedAt} />;
  },
};

function Title({ projectId, checkInId, insertedAt, author }) {
  const path = Paths.projectCheckInPath(projectId, checkInId);

  return (
    <>
      {People.shortName(author)} acknowledged:{" "}
      <Link to={path}>Check-In on {<FormattedTime time={insertedAt} format="short-date" />}</Link>
      <Icons.IconSquareCheckFilled size={20} className="text-accent-1 inline ml-2" />
    </>
  );
}
