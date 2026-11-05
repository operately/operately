import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { DimmedActionLink, Link } from "../Link";
import { tn } from "../i18n";

const PREVIEW_LIMIT = 3;

export interface ActivityTaskListEntry {
  key: string;
  name: string;
  path: string;
}

export interface ActivityTaskListProps {
  tasks: ActivityTaskListEntry[];
  locale: string;
}

export function ActivityTaskList({ tasks, locale }: ActivityTaskListProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const remainingCount = tasks.length - PREVIEW_LIMIT;
  const visibleTasks = isExpanded ? tasks : tasks.slice(0, PREVIEW_LIMIT);
  const items = visibleTasks.map((_, index) => String(index));
  const parts = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).formatToParts(items);

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === "literal") return <React.Fragment key={`literal-${index}`}>{part.value}</React.Fragment>;
        const task = visibleTasks[Number(part.value)];
        if (!task) return null;
        return (
          <Link key={task.key} to={task.path} testId="activity-task-link">
            {task.name}
          </Link>
        );
      })}
      {remainingCount > 0 && (
        <>
          {" ("}
          <DimmedActionLink
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((expanded) => !expanded)}
            className="inline text-left"
            underline="hover"
            disableColorHoverEffect
            testId="activity-task-list-disclosure"
          >
            {isExpanded ? t("Collapse") : tn("Show {{count}} more task", "Show {{count}} more tasks", remainingCount)}
          </DimmedActionLink>
          {")"}
        </>
      )}
    </>
  );
}
