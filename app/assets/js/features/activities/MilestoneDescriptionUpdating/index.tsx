import type { ActivityContentMilestoneDescriptionUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { feedTitle, milestoneLink, projectLink } from "../feedItemLinks";
import type { ActivityHandler } from "../interfaces";

const MilestoneDescriptionUpdating: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(paths: Paths, activity: Activity) {
    return paths.projectPath(content(activity).project!.id!);
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

  FeedItemTitle({ activity, page }: { activity: Activity; page: string }) {
    const { project, milestone, milestoneName, hasDescription } = content(activity);
    const title = milestone ? milestoneLink(milestone, milestoneName) : `"${milestoneName}"`;

    const message = hasDescription
      ? ["updated milestone", title, "description"]
      : ["removed description from milestone", title];

    if (page === "project") {
      return feedTitle(activity, ...message);
    } else {
      return feedTitle(activity, ...message, "in", projectLink(project));
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
  },

  feedItemAlignment(_activity: Activity): "items-start" | "items-center" {
    return "items-center";
  },

  commentCount(_activity: Activity): number {
    throw new Error("Not implemented");
  },

  hasComments(_activity: Activity): boolean {
    throw new Error("Not implemented");
  },

  NotificationTitle(props: { activity: Activity }) {
    const { milestone, hasDescription } = content(props.activity);

    if (hasDescription) {
      return `Milestone "${milestone?.title}" description was updated`;
    } else {
      return `Milestone "${milestone?.title}" description was removed`;
    }
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentMilestoneDescriptionUpdating {
  return activity.content as ActivityContentMilestoneDescriptionUpdating;
}

export default MilestoneDescriptionUpdating;
