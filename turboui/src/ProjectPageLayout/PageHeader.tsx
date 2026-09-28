import React from "react";
import { useTranslation } from "react-i18next";
import { IconChevronRight, IconProject } from "../icons";
import { BlackLink } from "../Link";
import { PieChart } from "../PieChart";
import { PrivacyIndicator } from "../PrivacyIndicator";
import { StatusBadge } from "../StatusBadge";
import { TextField } from "../TextField";
import { translationText } from "../i18n";
import { ProjectPageLayout } from ".";

export function PageHeader(props: ProjectPageLayout.Props) {
  const { t } = useTranslation();
  const navigation =
    "space" in props
      ? [
          { to: props.space.link, label: props.space.name },
          {
            to: props.mode === "template" ? props.projectTemplatesLink || props.workmapLink : props.workmapLink,
            label: props.mode === "template" ? translationText(t("Project Templates")) : translationText(t("Projects")),
          },
        ]
      : [{ to: props.homeLink, label: translationText(t("Home")) }];

  const isInviteOnly = props.accessLevels?.company === "no_access" && props.accessLevels?.space === "no_access";

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

          {props.mode !== "template" && isInviteOnly && (
            <PrivacyIndicator
              privacyLevel="secret"
              resourceType="project"
              spaceName={"space" in props ? props.space.name : ""}
              iconSize={16}
              testId="privacy-indicator"
            />
          )}

          {props.mode === "template" ? (
            <>
              <StatusBadge status="pending" customLabel={translationText(t("Template"))} hideIcon />
              {props.archived && <StatusBadge status="paused" customLabel={translationText(t("Archived"))} hideIcon />}
            </>
          ) : (
            props.status && (
              <StatusBadge status={props.status} hideIcon className="scale-90 inline-block shrink-0 align-[5px]" />
            )
          )}

          {props.taskCompletion && <TaskCompletionIndicator stats={props.taskCompletion} />}
        </div>
      </div>
    </div>
  );
}

function TaskCompletionIndicator({ stats }: { stats: ProjectPageLayout.TaskCompletionStats }) {
  const { t } = useTranslation();
  const ariaLabel = translationText(
    t("{{percentage}}% tasks completed, {{completed}}/{{total}} tasks completed", {
      percentage: stats.percentage,
      completed: stats.completedCount,
      total: stats.totalCount,
    }),
  );

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
      <span>{t("{{percentage}}% tasks completed", { percentage: stats.percentage })}</span>
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
