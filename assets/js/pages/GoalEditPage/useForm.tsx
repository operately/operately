import * as React from "react";
import * as Companies from "@/models/companies";
import * as Time from "@/utils/time";
import * as Goals from "@/models/goals";
import * as People from "@/models/people";

import { useLoadedData } from "./loader";
import { createPath } from "@/utils/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { useNavigate } from "react-router-dom";
import { useListState } from "@/utils/useListState";

export interface FormState {
  fields: Fields;
  errors: Error[];
  submitting: boolean;

  submit: () => Promise<boolean>;
  cancel: () => void;
}

interface Error {
  field: string;
  message: string;
}

interface Fields {
  company: Companies.Company;
  me: People.Person;
  goal: Goals.Goal;

  name: string;
  champion: People.Person | null;
  reviewer: People.Person | null;
  timeframe: TimeframeOption;
  timeframeOptions: TimeframeOption[];
  targets: Target[];

  setName: (name: string) => void;
  setChampion: (champion: People.Person | null) => void;
  setReviewer: (reviewer: People.Person | null) => void;
  setTimeframe: (timeframe: TimeframeOption) => void;
  addTarget: () => void;
  removeTarget: (id: string) => void;
  updateTarget: (id: string, field: any, value: any) => void;
}

interface TimeframeOption {
  value: string;
  label: string;
}

interface Target {
  id: string;
  name: string;
  from: string;
  to: string;
  unit: string;
}

export function useForm(company: Companies.Company, me: People.Person): FormState {
  const { goal } = useLoadedData();

  const [name, setName] = React.useState<string>(goal.name);
  const [champion, setChampion] = React.useState<People.Person | null>(goal.champion!);
  const [reviewer, setReviewer] = React.useState<People.Person | null>(goal.reviewer!);
  const [timeframe, setTimeframe, timeframeOptions] = useTimeframe(goal.timeframe);
  const [targets, addTarget, removeTarget, updateTarget] = useTargets(goal);

  const fields = {
    company,
    goal,
    me,

    name,
    champion,
    reviewer,
    timeframe,
    timeframeOptions,
    targets,

    setName,
    setChampion,
    setReviewer,
    setTimeframe,
    addTarget,
    removeTarget,
    updateTarget,
  };

  const [submit, cancel, submitting, errors] = useSubmit(fields);

  return {
    fields,
    errors,
    submitting,
    submit,
    cancel,
  };
}

function useTimeframe(current: string): [TimeframeOption, (timeframe: TimeframeOption) => void, TimeframeOption[]] {
  let options: TimeframeOption[] = [
    { value: Time.nQuartersFromNow(0), label: `${Time.nQuartersFromNow(0)}` },
    { value: Time.nQuartersFromNow(1), label: `${Time.nQuartersFromNow(1)}` },
    { value: Time.nQuartersFromNow(2), label: `${Time.nQuartersFromNow(2)}` },
    { value: Time.nQuartersFromNow(3), label: `${Time.nQuartersFromNow(3)}` },
    { value: Time.currentYear().toString(), label: `${Time.currentYear()}` },
    { value: Time.nextYear().toString(), label: `${Time.nextYear()}` },
  ];

  options = options.filter((o) => o.value !== current);
  options.unshift({ value: current, label: current });

  const [timeframe, setTimeframe] = React.useState<TimeframeOption>(options[0]!);

  return [timeframe, setTimeframe, options];
}

function useTargets(
  goal: Goals.Goal,
): [Target[], () => void, (id: string) => void, (id: string, field: any, value: any) => void] {
  const [list, { add, remove, update }] = useListState<Target>(initialTargets(goal));

  const addTarget = () => add(newEmptyTarget());

  return [list, addTarget, remove, update];
}

function initialTargets(goal: Goals.Goal): Target[] {
  return goal.targets!.map((t) => ({
    id: t!.id,
    name: t!.name,
    from: t!.from.toString(),
    to: t!.to.toString(),
    unit: t!.unit,
  }));
}

function newEmptyTarget() {
  return {
    id: Math.random().toString(),
    name: "",
    from: "",
    to: "",
    unit: "",
  };
}

function useSubmit(fields: Fields): [() => Promise<boolean>, () => void, boolean, Error[]] {
  const navigate = useNavigate();

  const [edit, { loading: submitting }] = Goals.useEditGoalMutation({
    onCompleted: (data: any) => navigate(createPath("goals", data.editGoal.id)),
  });

  const [errors, setErrors] = React.useState<Error[]>([]);

  const submit = async () => {
    const errors = validateForm(fields);

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    await edit({
      variables: {
        input: {
          goalId: fields.goal.id,
          name: fields.name,
          championID: fields.champion!.id,
          reviewerID: fields.reviewer!.id,
          timeframe: fields.timeframe.value,
          targets: fields.targets
            .filter((t) => t.name.trim() !== "")
            .map((t, index) => ({
              id: t.id,
              name: t.name,
              from: parseInt(t.from),
              to: parseInt(t.to),
              unit: t.unit,
              index: index,
            })),
        },
      },
    });

    return true;
  };

  const cancel = useNavigateTo(createPath("goals", fields.goal.id));

  return [submit, cancel, submitting, errors];
}

function validateForm(fields: Fields): Error[] {
  const errors: Error[] = [];

  if (fields.name.length === 0) errors.push({ field: "name", message: "Name is required" });
  if (fields.champion === null) errors.push({ field: "champion", message: "Champion is required" });
  if (fields.reviewer === null) errors.push({ field: "reviewer", message: "Reviewer is required" });
  if (fields.timeframe.value === null) errors.push({ field: "timeframe", message: "Timeframe is required" });

  fields.targets.forEach((target, index) => {
    let { name, from, to, unit } = target;

    name = name.trim();
    from = from.trim();
    to = to.trim();
    unit = unit.trim();

    if (name === "" && from === "" && to === "" && unit === "") return;

    if (name === "") errors.push({ field: `target-${index}-name`, message: "Name is required" });
    if (from === "") errors.push({ field: `target-${index}-from`, message: "From is required" });
    if (to === "") errors.push({ field: `target-${index}-to`, message: "To is required" });
    if (unit === "") errors.push({ field: `target-${index}-unit`, message: "Unit is required" });
  });

  return errors;
}
