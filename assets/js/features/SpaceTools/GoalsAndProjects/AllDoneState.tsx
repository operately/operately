import * as React from "react";
import * as Icons from "@tabler/icons-react";
import * as Time from "@/utils/time";

import { Space } from "@/models/spaces";
import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";

import { Title } from "../components";
import plurarize from "@/utils/plurarize";

interface Props {
  title: string;
  space: Space;
  goals: Goal[];
  projects: Project[];
}

export function AllDoneState(props: Props) {
  return (
    <div className="flex flex-col h-full">
      <Title title={props.title} />

      <div className="bg-surface-dimmed rounded mx-2 flex-1 flex flex-col px-2 py-4 items-center">
        <Icons.IconTrophy size={35} />
        <div className="text-sm font-bold mt-3 mb-1">All Done!</div>
        <div className="text-xs mb-1">{message(props)}</div>
      </div>
    </div>
  );
}

function message(props: Props) {
  const stats = calcStats(props);

  const constructMessage = (goals: number, projects: number, when: string) => {
    const goalsMsg = plurarize(goals, "goal", "goals");
    const projectsMsg = plurarize(projects, "project", "projects");

    if (goals > 0 && projects > 0) {
      return `${goalsMsg} and ${projectsMsg} completed ${when}.`;
    } else if (goals > 0) {
      return `${goalsMsg} completed ${when}.`;
    } else {
      return `${projectsMsg} completed ${when}.`;
    }
  };

  if (stats.completedGoals.thisQuarter > 0 || stats.completedProjects.thisQuarter > 0) {
    return constructMessage(stats.completedGoals.thisQuarter, stats.completedProjects.thisQuarter, "this quarter");
  }

  if (stats.completedGoals.lastQuarter > 0 || stats.completedProjects.lastQuarter > 0) {
    return constructMessage(stats.completedGoals.lastQuarter, stats.completedProjects.lastQuarter, "last quarter");
  }

  if (stats.completedGoals.thisYear > 0 || stats.completedProjects.thisYear > 0) {
    return constructMessage(stats.completedGoals.thisYear, stats.completedProjects.thisYear, "this year");
  }

  if (stats.completedGoals.lastYear > 0 || stats.completedProjects.lastYear > 0) {
    return constructMessage(stats.completedGoals.lastYear, stats.completedProjects.lastYear, "last year");
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
    if (project.status !== "closed") return;

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
