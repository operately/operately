import * as React from "react";
import * as People from "@/models/people";
import * as Time from "@/utils/time";

import FormattedTime from "@/components/FormattedTime";

import { Container } from "../FeedItemElements";

export default function ({ activity }) {
  return (
    <Container
      title={People.shortName(activity.author) + " edited the timeline"}
      author={activity.author}
      time={activity.insertedAt}
      content={<Content activity={activity} />}
    />
  );
}

function Content({ activity }) {
  const oldStartDate = Time.parseDate(activity.content.oldStartDate);
  const newStartDate = Time.parseDate(activity.content.newStartDate);
  const oldDueDate = Time.parseDate(activity.content.oldEndDate);
  const newDueDate = Time.parseDate(activity.content.newEndDate);

  if (!oldDueDate && newDueDate && newStartDate) {
    const time = <FormattedTime time={newDueDate} format="long-date" />;
    const duration = Time.daysBetween(newStartDate, newDueDate);

    return (
      <>
        The due date was set to {time}. <br />
        Total project duration is {duration} days.
      </>
    );
  }

  if (oldStartDate && oldDueDate && newStartDate && newDueDate) {
    const time = <FormattedTime time={newDueDate} format="long-date" />;

    const oldDuration = Time.daysBetween(oldStartDate, oldDueDate);
    const newDuration = Time.daysBetween(newStartDate, newDueDate);
    const direction = newDuration > oldDuration ? "increased" : "decreased";

    let percentageChange = Math.round((Math.abs(newDuration - oldDuration) / oldDuration) * 100);

    return (
      <>
        The due date was set to {time}. <br /> Total project duration {direction} by {percentageChange}% ({oldDuration}{" "}
        days -&gt; {newDuration} days).
      </>
    );
  }

  return null;
}
