import { useTranslation } from "react-i18next";
import * as React from "react";
import * as Time from "@/utils/time";

import { Space } from "@/models/spaces";
import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";

import { Title } from "../components";
import { tn } from "@/i18n";
import { IconTrophy } from "turboui";

interface Props {
  title: string;
  space: Space;
  goals: Goal[];
  projects: Project[];
}

export function AllDoneState(props: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-full">
      <Title title={props.title} />

      <div className="bg-surface-dimmed rounded mx-2 flex-1 flex flex-col px-2 py-4 items-center">
        <IconTrophy size={35} />
        <div className="text-sm font-bold mt-3 mb-1">{t("All done!")}</div>
        <div className="text-xs mb-1">{message(props)}</div>
      </div>
    </div>
  );
}

function message(props: Props) {
  const stats = calcStats(props);

  if (stats.completedGoals.thisQuarter > 0 || stats.completedProjects.thisQuarter > 0) {
    return completedWorkMessage(stats.completedGoals.thisQuarter, stats.completedProjects.thisQuarter, "thisQuarter");
  }

  if (stats.completedGoals.lastQuarter > 0 || stats.completedProjects.lastQuarter > 0) {
    return completedWorkMessage(stats.completedGoals.lastQuarter, stats.completedProjects.lastQuarter, "lastQuarter");
  }

  if (stats.completedGoals.thisYear > 0 || stats.completedProjects.thisYear > 0) {
    return completedWorkMessage(stats.completedGoals.thisYear, stats.completedProjects.thisYear, "thisYear");
  }

  if (stats.completedGoals.lastYear > 0 || stats.completedProjects.lastYear > 0) {
    return completedWorkMessage(stats.completedGoals.lastYear, stats.completedProjects.lastYear, "lastYear");
  }

  // Leave it empty if no goals or projects were completed in the last two years
  return "";
}

interface Stats {
  completedGoals: {
    thisQuarter: number;
    lastQuarter: number;
    thisYear: number;
    lastYear: number;
  };
  completedProjects: {
    thisQuarter: number;
    lastQuarter: number;
    thisYear: number;
    lastYear: number;
  };
}

function completedWorkMessage(goals: number, projects: number, period: keyof Stats["completedGoals"]) {
  // Keep both resource nouns and the time period in the sentence. The project
  // count selects the plural form when both kinds of work are present.
  switch (period) {
    case "thisQuarter":
      if (goals === 0)
        return tn("1 project completed this quarter.", "{{count}} projects completed this quarter.", projects);
      if (projects === 0) return tn("1 goal completed this quarter.", "{{count}} goals completed this quarter.", goals);
      if (goals === 1)
        return tn(
          "1 goal and 1 project completed this quarter.",
          "1 goal and {{count}} projects completed this quarter.",
          projects,
        );
      return tn(
        "{{goals}} goals and 1 project completed this quarter.",
        "{{goals}} goals and {{count}} projects completed this quarter.",
        projects,
        { goals },
      );
    case "lastQuarter":
      if (goals === 0)
        return tn("1 project completed last quarter.", "{{count}} projects completed last quarter.", projects);
      if (projects === 0) return tn("1 goal completed last quarter.", "{{count}} goals completed last quarter.", goals);
      if (goals === 1)
        return tn(
          "1 goal and 1 project completed last quarter.",
          "1 goal and {{count}} projects completed last quarter.",
          projects,
        );
      return tn(
        "{{goals}} goals and 1 project completed last quarter.",
        "{{goals}} goals and {{count}} projects completed last quarter.",
        projects,
        { goals },
      );
    case "thisYear":
      if (goals === 0) return tn("1 project completed this year.", "{{count}} projects completed this year.", projects);
      if (projects === 0) return tn("1 goal completed this year.", "{{count}} goals completed this year.", goals);
      if (goals === 1)
        return tn(
          "1 goal and 1 project completed this year.",
          "1 goal and {{count}} projects completed this year.",
          projects,
        );
      return tn(
        "{{goals}} goals and 1 project completed this year.",
        "{{goals}} goals and {{count}} projects completed this year.",
        projects,
        { goals },
      );
    case "lastYear":
      if (goals === 0) return tn("1 project completed last year.", "{{count}} projects completed last year.", projects);
      if (projects === 0) return tn("1 goal completed last year.", "{{count}} goals completed last year.", goals);
      if (goals === 1)
        return tn(
          "1 goal and 1 project completed last year.",
          "1 goal and {{count}} projects completed last year.",
          projects,
        );
      return tn(
        "{{goals}} goals and 1 project completed last year.",
        "{{goals}} goals and {{count}} projects completed last year.",
        projects,
        { goals },
      );
  }
}

function calcStats(props: Props): Stats {
  const stats = {
    completedGoals: {
      thisQuarter: 0,
      lastQuarter: 0,
      thisYear: 0,
      lastYear: 0,
    },
    completedProjects: {
      thisQuarter: 0,
      lastQuarter: 0,
      thisYear: 0,
      lastYear: 0,
    },
  };

  // Count completed goals and projects by quarter and year

  props.goals.forEach((goal) => {
    if (!goal.closedAt) return;

    const date = Time.parse(goal.closedAt);
    if (!date) return;

    if (Time.isThisQuarter(date)) {
      stats.completedGoals.thisQuarter++;
    } else if (Time.isLastQuarter(date)) {
      stats.completedGoals.lastQuarter++;
    } else if (Time.isThisYear(date)) {
      stats.completedGoals.thisYear++;
    } else if (Time.isLastYear(date)) {
      stats.completedGoals.lastYear++;
    }
  });

  props.projects.forEach((project) => {
    if (project.state !== "closed") return;

    const date = Time.parse(project.closedAt);
    if (!date) return;

    if (Time.isThisQuarter(date)) {
      stats.completedProjects.thisQuarter++;
    } else if (Time.isLastQuarter(date)) {
      stats.completedProjects.lastQuarter++;
    } else if (Time.isThisYear(date)) {
      stats.completedProjects.thisYear++;
    } else if (Time.isLastYear(date)) {
      stats.completedProjects.lastYear++;
    }
  });

  return stats;
}
