import * as React from "react";
import * as People from "@/models/people";
import * as Timeframes from "@/utils/timeframes";

import { FeedItem, Container } from "../FeedItem";
import { GoalLink } from "../shared/GoalLink";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { isContentEmpty } from "@/components/RichContent/isContentEmpty";

import RichContent from "@/components/RichContent";

export const GoalTimeframeEditing: FeedItem = {
  typename: "ActivityContentGoalTimeframeEditing",

  contentQuery: `
    goal {
      id
      name
    }

    oldTimeframe {
      startDate
      endDate
      type
    }

    newTimeframe {
      startDate
      endDate
      type
    }
  `,

  component: ({ activity, content, page }) => {
    return (
      <Container
        title={<Title activity={activity} content={content} page={page} />}
        author={activity.author}
        time={activity.insertedAt}
        content={<Content activity={activity} />}
      />
    );
  },
};

function Title({ activity, content, page }) {
  const oldTimeframe = Timeframes.parse(content.oldTimeframe);
  const newTimeframe = Timeframes.parse(content.newTimeframe);

  let what = "";

  if (Timeframes.compareDuration(oldTimeframe, newTimeframe) === 1) {
    what = "extended the timeframe";
  } else {
    what = "shortened the timeframe";
  }

  let whatLink = <Link to={Paths.goalActivityPath(content.goal.id, activity.id)}>{what}</Link>;

  return (
    <>
      {People.shortName(activity.author)} {whatLink} for{" "}
      <GoalLink goal={content.goal} page={page} showOnGoalPage={true} />
    </>
  );
}

function Content({ activity }) {
  const content = activity.content;

  const oldTimeframe = Timeframes.parse(content.oldTimeframe);
  const newTimeframe = Timeframes.parse(content.newTimeframe);

  return (
    <div>
      <div className="flex items-center gap-1 font-medium mt-1">
        <span className="w-10">New</span>
        <div className="border border-stroke-base rounded-md px-2 py-0.5 bg-base font-medium">
          {Timeframes.format(newTimeframe)}
        </div>
        {Timeframes.dayCount(newTimeframe)} days
      </div>

      <div className="flex items-center gap-1 mt-1 font-medium">
        <span className="w-10">Old</span>
        <div className="border border-stroke-base rounded-md px-2 py-0.5 bg-base font-medium">
          {Timeframes.format(oldTimeframe)}
        </div>
        {Timeframes.dayCount(oldTimeframe)} days
      </div>

      {activity.commentThread && !isContentEmpty(activity.commentThread.message) && (
        <div className="mt-2">
          <RichContent jsonContent={activity.commentThread.message} />
        </div>
      )}
    </div>
  );
}
