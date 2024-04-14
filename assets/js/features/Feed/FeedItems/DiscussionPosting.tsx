import * as React from "react";
import * as People from "@/models/people";

import { FeedItem, Container } from "../FeedItem";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { Summary } from "@/components/RichContent";

export const DiscussionPosting: FeedItem = {
  typename: "ActivityContentDiscussionPosting",
  contentQuery: `
    space {
      id
      name
    }

    discussion {
      id
      title
      body
    }
  `,

  component: ({ activity, content, page }) => {
    const space = content.space;
    const discussion = content.discussion;

    const path = Paths.discussionPath(space.id, discussion.id);
    const link = <Link to={path}>{discussion.title}</Link>;

    const spacePath = Paths.spacePath(space.id);
    const spaceLink = <Link to={spacePath}>{space.name}</Link>;

    const summary = <Summary jsonContent={discussion.body} characterCount={200} />;

    const title = (
      <>
        {People.shortName(activity.author)} posted: {link} <>{page !== "space" && <>in {spaceLink}</>} </>
      </>
    );

    return <Container title={title} author={activity.author} time={activity.insertedAt} content={summary} />;
  },
};
