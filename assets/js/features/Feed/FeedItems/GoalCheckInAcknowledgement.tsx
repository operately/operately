import * as React from "react";
import * as People from "@/models/people";

import FormattedTime from "@/components/FormattedTime";

import { Container } from "../FeedItemElements";
import { Link } from "@/components/Link";

import * as Time from "@/utils/time";
import * as Icons from "@tabler/icons-react";

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
      {People.shortName(activity.author)} acknowledged: {link}
      <Icons.IconSquareCheckFilled size={20} className="text-accent-1 inline ml-2" />
    </>
  );

  return <Container title={title} author={activity.author} time={activity.insertedAt} />;
}
