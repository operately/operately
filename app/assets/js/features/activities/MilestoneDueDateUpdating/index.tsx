import React from "react";

import type { ActivityContentMilestoneDueDateUpdating } from "@/api";
import type { Activity } from "@/models/activities";
import { Paths } from "@/routes/paths";
import { Trans } from "../i18n";
import i18n from "@/i18n";
import { activityAuthorName, milestoneLink, projectLink } from "../feedItemLinks";
import type { ActivityHandler, FeedItemProps } from "../interfaces";
import { DateField } from "turboui";
import { parseContextualDate } from "@/models/contextualDates";

const MilestoneDueDateUpdating: ActivityHandler = {
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

  FeedItemTitle({ activity, page, paths }: FeedItemProps) {
    const { project, milestone, milestoneName, newDueDate } = content(activity);
    const title = milestone ? milestoneLink(paths, milestone, milestoneName) : <React.Fragment />;
    const values = {
      author: activityAuthorName(activity),
      title: milestone ? milestoneName || milestone.title : `"${milestoneName}"`,
      projectName: project.name,
    };
    const components = {
      milestone: title,
      project: projectLink(paths, project),
    };

    if (page === "project") {
      return newDueDate
        ? <Trans i18nKey="{{author}} updated the due date for the <milestone>{{title}}</milestone> milestone" values={values} components={{ milestone: components.milestone }} />
        : <Trans i18nKey="{{author}} removed due date from the <milestone>{{title}}</milestone> milestone" values={values} components={{ milestone: components.milestone }} />;
    } else {
      return newDueDate
        ? <Trans i18nKey="{{author}} updated the due date for the <milestone>{{title}}</milestone> milestone in <project>{{projectName}}</project>" values={values} components={components} />
        : <Trans i18nKey="{{author}} removed due date from the <milestone>{{title}}</milestone> milestone in <project>{{projectName}}</project>" values={values} components={components} />;
    }
  },

  FeedItemContent({ activity }: { activity: Activity; page: any }) {
    const { oldDueDate, newDueDate } = content(activity);

    if (!oldDueDate && newDueDate) {
      return (
        <span>
          <Trans
            i18nKey="Due date was set to <date><value/></date>."
            components={{
              date: <span className="inline-block" />,
              value: <DateField date={parseContextualDate(newDueDate)} readonly hideCalendarIcon />,
            }}
          />
        </span>
      );
    }

    if (oldDueDate && !newDueDate) {
      return (
        <span>
          <Trans
            i18nKey="Due date <date><value/></date> was removed."
            components={{
              date: <span className="inline-block" />,
              value: <DateField date={parseContextualDate(oldDueDate)} readonly hideCalendarIcon />,
            }}
          />
        </span>
      );
    }

    if (oldDueDate && newDueDate) {
      return (
        <span>
          <Trans
            i18nKey="Due date was changed from <old><oldDate/></old> to <new><newDate/></new>."
            components={{
              old: <span className="inline-block" />,
              new: <span className="inline-block" />,
              oldDate: <DateField date={parseContextualDate(oldDueDate)} readonly hideCalendarIcon />,
              newDate: <DateField date={parseContextualDate(newDueDate)} readonly hideCalendarIcon />,
            }}
          />
        </span>
      );
    }

    return <Trans i18nKey="Due date was updated." />;
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
    const { milestone, newDueDate } = content(props.activity);

    if (newDueDate) {
      return i18n.t('The "{{title}}" milestone due date was updated', { title: String(milestone?.title) });
    } else {
      return i18n.t('The "{{title}}" milestone due date was removed', { title: String(milestone?.title) });
    }
  },

  NotificationLocation(props: { activity: Activity }) {
    return content(props.activity).project!.name!;
  },
};

function content(activity: Activity): ActivityContentMilestoneDueDateUpdating {
  return activity.content as ActivityContentMilestoneDueDateUpdating;
}

export default MilestoneDueDateUpdating;
