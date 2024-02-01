import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";
import * as Projects from "@/graphql/Projects";
import * as UpdateContent from "@/graphql/Projects/update_content";

export interface HealthState {
  status: string;
  setStatus: (value: string) => void;
  schedule: string;
  setSchedule: (value: string) => void;
  budget: string;
  setBudget: (value: string) => void;
  team: string;
  setTeam: (value: string) => void;
  risks: string;
  setRisks: (value: string) => void;

  statusEditor: ReturnType<typeof TipTapEditor.useEditor>;
  scheduleEditor: ReturnType<typeof TipTapEditor.useEditor>;
  budgetEditor: ReturnType<typeof TipTapEditor.useEditor>;
  teamEditor: ReturnType<typeof TipTapEditor.useEditor>;
  risksEditor: ReturnType<typeof TipTapEditor.useEditor>;
}

export function useHealthState(project: Projects.Project): HealthState {
  const lastHealthState = lastKnownHealthState(project);

  const [status, setStatus] = React.useState(lastHealthState.status);
  const [schedule, setSchedule] = React.useState(lastHealthState.schedule);
  const [budget, setBudget] = React.useState(lastHealthState.budget);
  const [team, setTeam] = React.useState(lastHealthState.team);
  const [risks, setRisks] = React.useState(lastHealthState.risks);

  let statusEditor = TipTapEditor.useEditor({
    placeholder: "Add details...",
    peopleSearch: People.usePeopleSearch(),
    className: "px-2 py-1 min-h-[4em]",
    editable: true,
    content: JSON.parse(lastHealthState.statusComments),
  });

  let scheduleEditor = TipTapEditor.useEditor({
    placeholder: "Add details...",
    peopleSearch: People.usePeopleSearch(),
    className: "px-2 py-1 min-h-[4em]",
    editable: true,
    content: JSON.parse(lastHealthState.scheduleComments),
  });

  let budgetEditor = TipTapEditor.useEditor({
    placeholder: "Add details...",
    peopleSearch: People.usePeopleSearch(),
    className: "px-2 py-1 min-h-[4em]",
    editable: true,
    content: JSON.parse(lastHealthState.budgetComments),
  });

  let teamEditor = TipTapEditor.useEditor({
    placeholder: "Add details...",
    peopleSearch: People.usePeopleSearch(),
    className: "px-2 py-1 min-h-[4em]",
    editable: true,
    content: JSON.parse(lastHealthState.teamComments),
  });

  let risksEditor = TipTapEditor.useEditor({
    placeholder: "Explain the risks...",
    peopleSearch: People.usePeopleSearch(),
    className: "px-2 py-1 min-h-[4em]",
    editable: true,
    content: JSON.parse(lastHealthState.risksComments),
  });

  return {
    status,
    setStatus,
    schedule,
    setSchedule,
    budget,
    setBudget,
    team,
    setTeam,
    risks,
    setRisks,
    statusEditor,
    scheduleEditor,
    budgetEditor,
    teamEditor,
    risksEditor,
  };
}

function lastKnownHealthState(project: Projects.Project): UpdateContent.ProjectHealth {
  const lastCheckIn = project.lastCheckIn?.content as UpdateContent.StatusUpdate | undefined;

  if (!lastCheckIn) return initialHealthState();
  if (!lastCheckIn.health) return initialHealthState();

  return lastCheckIn.health;
}

function initialHealthState(): UpdateContent.ProjectHealth {
  return {
    status: "on_track",
    schedule: "on_schedule",
    budget: "within_budget",
    team: "staffed",
    risks: "no_known_risks",

    statusComments: "{}",
    scheduleComments: "{}",
    budgetComments: "{}",
    teamComments: "{}",
    risksComments: "{}",
  };
}
