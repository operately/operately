import React from "react";
import { useTranslation } from "react-i18next";
import { ActionLink, Link } from "../Link";
import { tn } from "../i18n";

export interface ActivityResourceEntry {
  key: string;
  name: string;
  path?: string;
  details?: React.ReactNode;
}

export interface ActivityResourceListProps {
  entries: ActivityResourceEntry[];
  locale: string;
}

// Keep each resource once, retaining change details in the supplied order.
export function normalizeActivityResourceEntries(entries: ActivityResourceEntry[]): ActivityResourceEntry[] {
  const resources = new Map<string, ActivityResourceEntry>();
  for (const entry of entries) {
    const previous = resources.get(entry.key);
    resources.set(
      entry.key,
      previous
        ? {
            ...previous,
            details:
              previous.details && entry.details ? (
                <>
                  {previous.details}
                  {entry.details}
                </>
              ) : (
                (previous.details ?? entry.details)
              ),
          }
        : entry,
    );
  }
  return Array.from(resources.values());
}

export function ActivityResourceList({ entries, locale }: ActivityResourceListProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = React.useState(false);
  const resources = normalizeActivityResourceEntries(entries);
  const visible = expanded ? resources : resources.slice(0, 3);
  const remaining = resources.length - 3;
  const hasDetails = visible.some((entry) => entry.details);
  const parts = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).formatToParts(
    visible.map((_, index) => String(index)),
  );

  return (
    <span className="break-words" data-test-id="activity-resource-list">
      <span key="entries">
        {parts.map((part, index) => {
          if (part.type === "literal")
            return hasDetails ? null : <React.Fragment key={`separator-${index}`}>{part.value}</React.Fragment>;
          const entry = visible[Number(part.value)];
          if (!entry) return null;
          return (
            <span
              key={entry.key}
              className={hasDetails ? "block mt-1" : undefined}
              data-test-id="activity-resource-entry"
            >
              {entry.path ? <Link to={entry.path}>{entry.name}</Link> : entry.name}
              {entry.details && (
                <span className="block text-sm font-normal text-content-base" data-test-id="activity-resource-details">
                  {entry.details}
                </span>
              )}
            </span>
          );
        })}
      </span>
      {remaining > 0 && (
        <React.Fragment key="toggle">
          {" "}
          <ActionLink
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
            testId="activity-resource-toggle"
          >
            {expanded ? t("Show less") : tn("Show 1 more", "Show {{count}} more", remaining)}
          </ActionLink>
        </React.Fragment>
      )}
    </span>
  );
}
