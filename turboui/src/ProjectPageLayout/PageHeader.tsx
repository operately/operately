import React from "react";
import { IconChevronRight, IconProject } from "../icons";
import { BlackLink } from "../Link";
import { PieChart } from "../PieChart";
import { PrivacyIndicator } from "../PrivacyIndicator";
import { StatusBadge } from "../StatusBadge";
import { TextField } from "../TextField";
import { ProjectPageLayout } from ".";

export function PageHeader(props: ProjectPageLayout.Props) {
  const navigation =
    "space" in props
      ? [
          { to: props.space.link, label: props.space.name },
          { to: props.workmapLink, label: "Projects" },
        ]
      : [{ to: props.homeLink, label: "Home" }];

  const isInviteOnly =
    props.accessLevels?.company === "no_access" && props.accessLevels?.space === "no_access";

  return (
    <div className="mt-4 px-4 flex items-center gap-3">
      <IconProject size={38} className="rounded-lg bg-blue-50 dark:bg-blue-900" />

      <div className="min-w-0">
        <Breadcrumbs navigation={navigation} />

        <div className="flex flex-wrap items-center gap-2">
          <TextField
            className="font-semibold text-lg"
            text={props.projectName}
            onChange={props.updateProjectName}
            readonly={!props.permissions.canEdit}
            trimBeforeSave
            testId="project-name-field"
          />

          {isInviteOnly && (
            <PrivacyIndicator
              privacyLevel="secret"
              resourceType="project"
              spaceName={"space" in props ? props.space.name : ""}
              iconSize={16}
              testId="privacy-indicator"
            />
          )}

          <StatusBadge status={props.status} hideIcon className="scale-90 inline-block shrink-0 align-[5px]" />

          {props.taskCompletion && <TaskCompletionIndicator stats={props.taskCompletion} />}
        </div>
      </div>
    </div>
  );
}

function TaskCompletionIndicator({ stats }: { stats: ProjectPageLayout.TaskCompletionStats }) {
  const title = `${stats.completedCount}/${stats.totalCount} tasks completed`;
  const ariaLabel = `${stats.percentage}% tasks completed, ${title}`;

  return (
    <div
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-1/20 bg-brand-2 px-2 py-0.5 text-xs font-medium text-content-accent dark:border-surface-outline dark:bg-surface-base dark:text-content-base"
      title={ariaLabel}
    >
      <PieChart
        size={14}
        slices={[{ percentage: stats.percentage, color: "var(--color-brand-1)" }]}
        ariaLabel={ariaLabel}
      />
      <span>{stats.percentage}% tasks completed</span>
      <span className="text-content-subtle dark:text-content-dimmed">
        {stats.completedCount}/{stats.totalCount}
      </span>
    </div>
  );
}

function Breadcrumbs({ navigation }: { navigation: { to: string; label: string }[] }) {
  return (
    <div>
      <nav className="flex items-center space-x-0.5 mt-1">
        {navigation.map((item, index) => (
          <React.Fragment key={index}>
            <BlackLink to={item.to} className="text-xs text-content-dimmed leading-snug" underline="hover">
              {item.label}
            </BlackLink>
            {index < navigation.length - 1 && <IconChevronRight size={10} className="text-content-dimmed" />}
          </React.Fragment>
        ))}
      </nav>
    </div>
  );
}
