import * as People from "@/models/people";
import * as React from "react";

import type { ActivityContentProjectCheckInSubmitted } from "@/api";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";

import { ProjectLink } from "./../feedItemLinks";
import { Paths } from "@/routes/paths";
import { Link } from "@/components/Link";
import { Summary } from "@/components/RichContent";
import { SmallStatusIndicator } from "@/features/projectCheckIns/SmallStatusIndicator";

const ProjectCheckInSubmitted: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(_activity: Activity): string {
    throw new Error("Not implemented");
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
    const project = content(activity).project!;
    const checkIn = content(activity).checkIn!;
    const author = activity.author!;

    const checkInPath = Paths.projectCheckInPath(project.id!, checkIn.id!);
    const checkInLink = <Link to={checkInPath}>Check-In</Link>;

    return (
      <>
        {People.shortName(author)} submitted: a {checkInLink}{" "}
        <ProjectLink project={project} page={page} showOnProjectPage={false} />
      </>
    );
  },

  FeedItemContent({ activity }: { activity: Activity }) {
    const checkIn = content(activity).checkIn!;

    return (
      <div className="flex flex-col gap-2">
        <SmallStatusIndicator status={checkIn.status!} />
        <Summary jsonContent={checkIn.description} characterCount={200} />
      </div>
    );
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },

  CommentNotificationTitle(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },
};

function content(activity: Activity): ActivityContentProjectCheckInSubmitted {
  return activity.content as ActivityContentProjectCheckInSubmitted;
}

export default ProjectCheckInSubmitted;
