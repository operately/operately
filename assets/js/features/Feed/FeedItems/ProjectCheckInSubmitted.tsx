import * as React from "react";
import * as People from "@/models/people";

import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { Summary } from "@/components/RichContent";
import { FeedItem, Container } from "../FeedItem";
import { SmallStatusIndicator } from "@/features/projectCheckIns/SmallStatusIndicator";

import FormattedTime from "@/components/FormattedTime";

export const ProjectCheckInSubmitted: FeedItem = {
  typename: "ActivityContentProjectCheckInSubmitted",

  contentQuery: `
    project {
      id
      name
    }

    checkIn {
      id
      insertedAt
      status
      description
    }
  `,

  component: ({ activity, content, page }) => {
    const project = content.project;
    const checkIn = content.checkIn;

    const title = <Title author={activity.author} project={project} checkIn={checkIn} page={page} />;
    const summary = <Content checkIn={checkIn} />;

    return <Container title={title} author={activity.author} time={activity.insertedAt} content={summary} />;
  },
};

function Title({ author, project, checkIn, page }) {
  const checkInPath = Paths.projectCheckInPath(project.id, checkIn.id);
  const time = <FormattedTime time={checkIn.insertedAt} format="long-date" />;
  const projectPath = Paths.projectPath(project.id);

  return (
    <>
      {People.shortName(author)} submitted: <Link to={checkInPath}>Check-In on {time}</Link>{" "}
      {page !== "project" && (
        <>
          {" "}
          for the <Link to={projectPath}>{project.name}</Link> project
        </>
      )}
    </>
  );
}

function Content({ checkIn }) {
  return (
    <div className="flex flex-col gap-2">
      <SmallStatusIndicator status={checkIn.status} />
      <Summary jsonContent={checkIn.description} characterCount={200} />
    </div>
  );
}
