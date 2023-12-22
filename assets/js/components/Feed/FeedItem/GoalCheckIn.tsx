import * as React from "react";
import * as People from "@/models/people";

import { Container } from "../FeedItemElements";
import { Summary } from "@/components/RichContent";
import { Link } from "@/components/Link";

import FormattedTime from "@/components/FormattedTime";
import * as Time from "@/utils/time";

export default function ({ activity }) {
  const content = activity.content;
  const update = content.update;
  const goal = content.goal;

  const insertedAt = Time.parseISO(update.insertedAt);
  const time = <FormattedTime time={insertedAt} format="long-date" />;

  const path = `/goals/${goal.id}/check-ins/${update.id}`;
  const link = <Link to={path}>Check-In on {time}</Link>;

  const title = (
    <>
      {People.shortName(activity.author)} submitted: {link}
    </>
  );

  const summary = <Summary jsonContent={update.message} characterCount={200} />;

  return <Container title={title} author={activity.author} time={activity.insertedAt} content={summary} />;
}
