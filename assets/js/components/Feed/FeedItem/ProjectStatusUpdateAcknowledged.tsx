import * as React from "react";
import * as People from "@/models/people";

import FormattedTime from "@/components/FormattedTime";

import { Container } from "../FeedItemElements";
import { Link } from "@/components/Link";

import * as Time from "@/utils/time";

export default function ({ activity }) {
  const content = activity.content;
  const update = content.update;
  const projectId = content.projectId;

  const insertedAt = Time.parseISO(update.insertedAt);
  const time = <FormattedTime time={insertedAt} format="long-date" />;

  const path = `/projects/${projectId}/status_updates/${update.id}`;
  const link = <Link to={path}>Check-In on {time}</Link>;
  const title = (
    <>
      {People.shortName(activity.author)} acknowledged: {link}
    </>
  );

  return <Container title={title} author={activity.author} time={activity.insertedAt} />;
}
