import * as People from "@/models/people";
import * as React from "react";

import type { ActivityContentProjectCheckInSubmitted } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { Summary } from "@/components/RichContent";
import { SmallStatusIndicator } from "@/components/status";

import { usePaths } from "@/routes/paths";
import { Link } from "turboui";
import { feedTitle, projectLink } from "./../feedItemLinks";

const ProjectCheckInSubmitted: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths, activity: Activity): string {
    return paths.projectCheckInPath(content(activity).checkIn!.id!);
  },

  PageTitle(_props: { activity: any }) {
    throw new Error("Not implemented");
  },

  PageContent(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  PageOptions(_props: { activity: Activity }) {
    return null;
  },

  FeedItemTitle({ activity, page }: { activity: Activity; page: any }) {
    const paths = usePaths();
    const project = content(activity).project!;
    const checkIn = content(activity).checkIn!;

    const checkInPath = paths.projectCheckInPath(checkIn.id!);
    const checkInLink = <Link to={checkInPath}>Check-In</Link>;

    if (page === "project") {
      return feedTitle(activity, "submitted a ", checkInLink);
    } else {
      return feedTitle(activity, "submitted a ", checkInLink, " in the ", projectLink(project), "project");
    }
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const checkIn = content(activity).checkIn!;

    return (
      <div className="flex flex-col gap-2">
        <SmallStatusIndicator status={checkIn.status!} />
        <Summary jsonContent={checkIn.description!} characterCount={200} />
      </div>
    );
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-start";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle({ activity }: { activity: Activity }) {
    return "Submitted a check-in";
  },

  NotificationLocation({ activity }: { activity: Activity }) {
    return content(activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentProjectCheckInSubmitted {
  return activity.content as ActivityContentProjectCheckInSubmitted;
}

export default ProjectCheckInSubmitted;
