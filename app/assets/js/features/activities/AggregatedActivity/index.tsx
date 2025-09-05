import * as React from "react";
import * as People from "@/models/people";

import type { AggregatedActivity } from "@/models/activities";
import type { Activity } from "@/models/activities";
import type { ActivityHandler } from "../interfaces";
import { Paths } from "@/routes/paths";

import ActivityHandler as SingleActivityHandler from "../index";

const AggregatedActivityHandler: ActivityHandler = {
  pageHtmlTitle(_activity: Activity | AggregatedActivity) {
    throw new Error("Not implemented for aggregated activities");
  },

  pagePath(_paths: Paths, _activity: Activity | AggregatedActivity): string {
    throw new Error("Not implemented for aggregated activities");
  },

  PageTitle(_props: { activity: Activity | AggregatedActivity }) {
    throw new Error("Not implemented for aggregated activities");
  },

  PageContent(_props: { activity: Activity | AggregatedActivity }) {
    throw new Error("Not implemented for aggregated activities");
  },

  PageOptions(_props: { activity: Activity | AggregatedActivity }) {
    return null;
  },

  FeedItemTitle({ activity, page }: { activity: Activity | AggregatedActivity; page: any }) {
    if ((activity as AggregatedActivity).type !== "aggregated") {
      throw new Error("Expected aggregated activity");
    }
    
    const aggregated = activity as AggregatedActivity;
    const author = People.firstName(aggregated.author!);
    const resources = extractResources(aggregated);
    const location = extractLocation(aggregated, page);
    
    const actionText = getActionText(aggregated.action);
    const resourceList = formatResourceList(resources);
    
    if (location) {
      return (
        <span>
          {author} {actionText} {resourceList} {location}
        </span>
      );
    } else {
      return (
        <span>
          {author} {actionText} {resourceList}
        </span>
      );
    }
  },

  FeedItemContent({ activity }: { activity: Activity | AggregatedActivity; page: any }) {
    if ((activity as AggregatedActivity).type !== "aggregated") {
      throw new Error("Expected aggregated activity");
    }
    
    const aggregated = activity as AggregatedActivity;
    return (
      <div className="text-xs text-content-dimmed">
        {aggregated.activities.length} related changes
      </div>
    );
  },

  feedItemAlignment(_activity: Activity | AggregatedActivity): "items-start" | "items-center" {
    return "items-start";
  },

  commentCount(_activity: Activity | AggregatedActivity): number {
    throw new Error("Not implemented for aggregated activities");
  },

  hasComments(_activity: Activity | AggregatedActivity): boolean {
    return false;
  },

  NotificationTitle({ activity }: { activity: Activity | AggregatedActivity }) {
    if ((activity as AggregatedActivity).type !== "aggregated") {
      throw new Error("Expected aggregated activity");
    }
    
    const aggregated = activity as AggregatedActivity;
    return People.firstName(aggregated.author!) + " made multiple changes";
  },

  NotificationLocation({ activity }: { activity: Activity | AggregatedActivity }) {
    if ((activity as AggregatedActivity).type !== "aggregated") {
      throw new Error("Expected aggregated activity");
    }
    
    const aggregated = activity as AggregatedActivity;
    const firstActivity = aggregated.activities[0]!;
    try {
      return SingleActivityHandler.NotificationLocation({ activity: firstActivity });
    } catch {
      return null;
    }
  },
};

function extractResources(activity: AggregatedActivity): string[] {
  const resources = new Set<string>();
  
  activity.activities.forEach(act => {
    const content = act.content as any;
    
    // Extract resource names based on activity type
    switch (act.action) {
      case "resource_hub_document_edited":
        if (content.document?.name) resources.add(content.document.name);
        break;
      case "resource_hub_file_edited":
        if (content.file?.name) resources.add(content.file.name);
        break;
      case "resource_hub_link_edited":
        if (content.link?.name) resources.add(content.link.name);
        break;
      case "goal_editing":
        if (content.goal?.name) resources.add(content.goal.name);
        break;
      case "project_renamed":
        if (content.newName) resources.add(content.newName);
        break;
      case "task_name_updating":
        if (content.newName) resources.add(content.newName);
        break;
      case "milestone_title_updating":
      case "milestone_description_updating":
        if (content.milestone?.title) resources.add(content.milestone.title);
        break;
    }
  });
  
  return Array.from(resources);
}

function extractLocation(activity: AggregatedActivity, page: any): string | null {
  const firstActivity = activity.activities[0]!;
  const content = firstActivity.content as any;
  
  if (page === "space") return null; // Don't show location if already in space context
  
  // Extract location based on activity type
  switch (firstActivity.action) {
    case "resource_hub_document_edited":
    case "resource_hub_file_edited":
    case "resource_hub_link_edited":
      return content.space?.name ? `in the ${content.space.name} space` : null;
    case "goal_editing":
      return content.goal?.space?.name ? `in the ${content.goal.space.name} space` : null;
    default:
      return null;
  }
}

function getActionText(action: string): string {
  switch (action) {
    case "resource_hub_document_edited":
    case "resource_hub_file_edited":
    case "resource_hub_link_edited":
    case "goal_editing":
      return "edited";
    case "project_renamed":
      return "renamed";
    case "task_name_updating":
      return "updated";
    case "milestone_title_updating":
    case "milestone_description_updating":
      return "updated";
    default:
      return "modified";
  }
}

function formatResourceList(resources: string[]): string {
  if (resources.length === 0) return "items";
  if (resources.length === 1) return resources[0]!;
  if (resources.length === 2) return `${resources[0]} and ${resources[1]}`;
  
  const lastResource = resources[resources.length - 1]!;
  const otherResources = resources.slice(0, -1);
  return `${otherResources.join(", ")}, and ${lastResource}`;
}

export default AggregatedActivityHandler;