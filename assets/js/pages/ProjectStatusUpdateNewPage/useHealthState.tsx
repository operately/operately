import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";

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

  scheduleEditor: ReturnType<typeof TipTapEditor.useEditor>;
  budgetEditor: ReturnType<typeof TipTapEditor.useEditor>;
  teamEditor: ReturnType<typeof TipTapEditor.useEditor>;
  risksEditor: ReturnType<typeof TipTapEditor.useEditor>;
}

export function useHealthState(): HealthState {
  const [status, setStatus] = React.useState("on_track");
  const [schedule, setSchedule] = React.useState("on_schedule");
  const [budget, setBudget] = React.useState("within_budget");
  const [team, setTeam] = React.useState("staffed");
  const [risks, setRisks] = React.useState("no_risks");

  let scheduleEditor = TipTapEditor.useEditor({
    placeholder: "Add details...",
    peopleSearch: People.usePeopleSearch(),
    className: "px-2 py-1 min-h-[4em]",
    editable: true,
  });

  let budgetEditor = TipTapEditor.useEditor({
    placeholder: "Add details...",
    peopleSearch: People.usePeopleSearch(),
    className: "px-2 py-1 min-h-[4em]",
    editable: true,
  });

  let teamEditor = TipTapEditor.useEditor({
    placeholder: "Add details...",
    peopleSearch: People.usePeopleSearch(),
    className: "px-2 py-1 min-h-[4em]",
    editable: true,
  });

  let risksEditor = TipTapEditor.useEditor({
    placeholder: "Explain the risks...",
    peopleSearch: People.usePeopleSearch(),
    className: "px-2 py-1 min-h-[4em]",
    editable: true,
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
    scheduleEditor,
    budgetEditor,
    teamEditor,
    risksEditor,
  };
}
