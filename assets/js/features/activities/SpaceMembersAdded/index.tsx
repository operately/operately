import { Activity, ActivityContentSpaceMembersAdded } from "@/api";
import { ActivityHandler } from "../interfaces";
import { feedTitle, spaceLink } from "../feedItemLinks";
import { Paths } from "@/routes/paths";
import { shortName, Person } from "@/models/people";


const SpaceMembersAdded: ActivityHandler = {
  pageHtmlTitle(_activity: Activity) {
    throw new Error("Not implemented");
  },

  pagePath(activity: Activity): string {
    return Paths.spacePath(content(activity).space!.id!);
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
    const names = formatNames(content(activity).members!);
    const space = spaceLink(content(activity).space!);

    if (page === "space") {
      return feedTitle(activity, "added", names, "to the space");
    } else {
      return feedTitle(activity, "added", names, "to the", space, "space");
    }
  },

  FeedItemContent(_props: { activity: Activity; page: any }) {
    return null;
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

  NotificationLocation(_props: { activity: Activity }) {
    throw new Error("Not implemented");
  },
};

export default SpaceMembersAdded;

function content(activity: Activity): ActivityContentSpaceMembersAdded {
  return activity.content as ActivityContentSpaceMembersAdded;
}

function formatNames(members: Person[]) {
  const names = members.map(person => shortName(person));

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  } 
  else if (names.length > 2) {
    const last = names.pop();
    return `${names.join(', ')} and ${last}`;
  }
  else {
    return names[0]!;
  }
}