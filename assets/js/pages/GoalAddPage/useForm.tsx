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
  isValid: boolean;
  submitting: boolean;

  submit: () => void;
  cancel: () => void;
}

interface Fields {
  spaceID: string;
  company: Companies.Company;
  me: People.Person;

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
  const { spaceID } = useLoadedData();

  const [name, setName] = React.useState<string>("");
  const [champion, setChampion] = React.useState<People.Person | null>(me);
  const [reviewer, setReviewer] = React.useState<People.Person | null>(null);
  const [timeframe, setTimeframe, timeframeOptions] = useTimeframe();
  const [targets, addTarget, removeTarget, updateTarget] = useTargets();

  const fields = {
    spaceID,
    company,
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

  const isValid = validateForm(fields);
  const [submit, cancel, submitting] = useSubmit(fields);

  return {
    fields,
    isValid,
    submitting,
    submit,
    cancel,
  };
}

function useTimeframe(): [TimeframeOption, (timeframe: TimeframeOption) => void, TimeframeOption[]] {
  const options: TimeframeOption[] = [
    { value: Time.nQuartersFromNow(0), label: `${Time.nQuartersFromNow(0)}` },
    { value: Time.nQuartersFromNow(1), label: `${Time.nQuartersFromNow(1)}` },
    { value: Time.nQuartersFromNow(2), label: `${Time.nQuartersFromNow(2)}` },
    { value: Time.nQuartersFromNow(3), label: `${Time.nQuartersFromNow(3)}` },
    { value: Time.currentYear().toString(), label: `${Time.currentYear()}` },
    { value: Time.nextYear().toString(), label: `${Time.nextYear()}` },
  ];

  const [timeframe, setTimeframe] = React.useState<TimeframeOption>(options[0]!);

  return [timeframe, setTimeframe, options];
}

function useTargets(): [Target[], () => void, (id: string) => void, (id: string, field: any, value: any) => void] {
  const [list, { add, remove, update }] = useListState<Target>([newEmptyTarget(), newEmptyTarget(), newEmptyTarget()]);

  const addTarget = () => add(newEmptyTarget());

  return [list, addTarget, remove, update];
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

function validateForm(fields: Fields): boolean {
  if (fields.name.length === 0) return false;
  if (fields.champion === null) return false;
  if (fields.reviewer === null) return false;
  if (fields.timeframe.value === null) return false;
  if (fields.targets.length === 0) return false;

  return true;
}

function useSubmit(fields: Fields): [() => void, () => void, boolean] {
  const navigate = useNavigate();

  const [create, { loading: submitting }] = Goals.useCreateGoalMutation({
    onCompleted: (data: any) => navigate(createPath("goals", data.createGoal.id)),
  });

  const submit = async () => {
    await create({
      variables: {
        input: {
          name: fields.name,
          spaceId: fields.spaceID,
          championID: fields.champion!.id,
          reviewerID: fields.reviewer!.id,
          timeframe: fields.timeframe.value,
        },
      },
    });
  };

  const cancel = useNavigateTo(createPath("spaces", fields.spaceID));

  return [submit, cancel, submitting];
}
