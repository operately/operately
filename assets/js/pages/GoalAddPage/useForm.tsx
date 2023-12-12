import * as React from "react";
import * as Companies from "@/models/companies";
import * as Time from "@/utils/time";
import * as Goals from "@/models/goals";
import * as People from "@/models/people";

import { useLoadedData } from "./loader";
import { createPath } from "@/utils/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { useNavigate } from "react-router-dom";

interface FormState {
  spaceID: string;
  company: Companies.Company;
  me: People.Person;

  name: string;
  champion: People.Person | null;
  reviewer: People.Person | null;
  timeframe: TimeframeOption;
  targets: TargetState[];

  setName: (name: string) => void;
  setChampion: (champion: People.Person | null) => void;
  setReviewer: (reviewer: People.Person | null) => void;
  setTimeframe: (timeframe: string) => void;
  addTarget: () => void;
  removeTarget: (id: string) => void;
  updateTarget: (id: string, field: any, value: any) => void;

  isValid: boolean;
  submit: () => void;
  cancel: () => void;
  submitting: boolean;
}

interface TimeframeOption {
  default: Option;
  selected: Option;
}

interface Option {
  value: string;
  label: string;
}

export function useForm(company: Companies.Company, me: People.Person): FormState {
  const { spaceID } = useLoadedData();
  const navigate = useNavigate();

  const cancel = useNavigateTo(createPath("spaces", spaceID));
  const timeframe = useTimeframe();
  const targetList = useTargetList();

  const [name, setName] = React.useState<string>("");
  const [champion, setChampion] = React.useState<People.Person | null>(me);
  const [reviewer, setReviewer] = React.useState<People.Person | null>(null);

  const nameIsValid = () => name.length > 0;
  const championIsValid = () => champion !== null;
  const reviewerIsValid = () => reviewer !== null;
  const timeframeIsValid = () => timeframe.selected.value !== null && timeframe.selected.value !== null;

  const isValid = timeframeIsValid() && nameIsValid() && championIsValid() && reviewerIsValid();

  const [create, { loading: submitting }] = Goals.useCreateGoalMutation({
    onCompleted: (data: any) => navigate(createPath("goals", data.createGoal.id)),
  });

  const submit = async () => {
    const selectedQuarter = timeframe.quarter.selected.value;
    const selectedYear = timeframe.year.selected.value;
    const timeframeCombined = selectedQuarter === "Whole Year" ? selectedYear : `${selectedYear}-${selectedQuarter}`;

    await create({
      variables: {
        input: {
          name,
          spaceId: spaceID,
          championID: champion,
          reviewerID: reviewer,
          timeframe: timeframeCombined,
        },
      },
    });
  };

  return {
    spaceID,
    company,
    me,

    name,
    setName,

    champion,
    setChampion,

    reviewer,
    setReviewer,

    timeframe,
    targetList,

    isValid,
    submit,
    cancel,
    submitting,
  };
}

function useTimeframe(): TimeframeState {
  const currentYear = Time.currentYear();

  const options = [{ value: currentYear.toString(), label: `${currentYear} (Current Year)` }];

  const [selected, setSelected] = React.useState<Option>(options[0]);

  return {
    options: options,
    default: options[0],
    selected: options[0],
    setSelected: (e: any) => setSelected(e.target.value),
  };
}

function isCurrentQuarter(quarter: number, year: string) {
  const currentYear = Time.currentYear();
  const currentQuarter = Time.currentQuarter();

  return quarter === currentQuarter && year === currentYear.toString();
}

function getDefaultQuarterOption(quarterOptions: Option[], year: string): Option {
  const currentYear = Time.currentYear();
  if (year !== currentYear.toString()) return quarterOptions[1] as Option;

  const currentQuarter = Time.currentQuarter();
  return quarterOptions.find((o) => o.value === `Q${currentQuarter}`) as Option;
}

interface TargetListState {
  targets: TargetState[];
  addTarget: () => void;
  removeTarget: (id: string) => void;
  updateTarget: (id: string, field: any, value: any) => void;
}

interface TargetState {
  id: string;
  name: string;
  from: string;
  to: string;
  unit: string;
}

function newTarget() {
  return {
    id: Math.random().toString(),
    name: "",
    from: "",
    to: "",
    unit: "",
  };
}

function useTargetList(): TargetListState {
  const [targets, setTargets] = React.useState<TargetState[]>([newTarget(), newTarget(), newTarget()]);

  const addTarget = () => {
    setTargets((prev) => [...prev, newTarget()]);
  };

  const removeTarget = (id: string) => {
    setTargets((prev) => prev.filter((t) => t.id !== id));
  };

  const updateTarget = (id: string, field: any, value: any) => {
    setTargets((prev) => {
      const target = prev.find((t) => t.id === id);
      if (!target) return prev;

      const updated = { ...target, [field]: value };
      return prev.map((t) => (t.id === id ? updated : t));
    });
  };

  return {
    targets,
    addTarget,
    removeTarget,
    updateTarget,
  };
}
