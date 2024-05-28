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
    project {
      id
      name
    }
  `,

  component: ({ activity, content, page }) => {
    const title = (
      <Title
        project={content.project}
        checkInId={content.checkInId}
        insertedAt={Time.parseISO(activity.insertedAt)}
        author={activity.author}
        page={page}
      />
    );

    return <Container title={title} author={activity.author} time={activity.insertedAt} />;
  },
};

function Title({ project, checkInId, insertedAt, author, page }) {
  const path = Paths.projectCheckInPath(project.id, checkInId);
  const projectPath = Paths.projectPath(project.id);

  return (
    <>
      {People.shortName(author)} acknowledged{" "}
      <Link to={path}>Check-In on {<FormattedTime timezone={""} time={insertedAt} format="short-date" />}</Link>
      {page !== "goal" && (
        <>
          {" "}
          for the <Link to={projectPath}>{project.name}</Link> project
        </>
      )}
      <Icons.IconSquareCheckFilled size={20} className="text-accent-1 inline ml-1" />
    </>
  );
}
