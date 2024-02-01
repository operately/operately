import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";
import * as Updates from "@/graphql/Projects/updates";
import * as UpdateContent from "@/graphql/Projects/update_content";

export interface HealthState {
  status: string;
  schedule: string;
  budget: string;
  team: string;
  risks: string;

  setStatus: (value: string) => void;
  setSchedule: (value: string) => void;
  setBudget: (value: string) => void;
  setTeam: (value: string) => void;
  setRisks: (value: string) => void;

  statusEditor: TipTapEditor.EditorState;
  scheduleEditor: TipTapEditor.EditorState;
  budgetEditor: TipTapEditor.EditorState;
  teamEditor: TipTapEditor.EditorState;
  risksEditor: TipTapEditor.EditorState;
}

export function useHealthState(checkIn: Updates.Update | null): HealthState {
  const lastHealthState = lastKnownHealthState(checkIn);

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

function lastKnownHealthState(checkIn: Updates.Update | null): UpdateContent.ProjectHealth {
  const content = checkIn?.content as UpdateContent.StatusUpdate | undefined;

  if (!content) return initialHealthState();
  if (!content.health) return initialHealthState();

  return content.health;
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
