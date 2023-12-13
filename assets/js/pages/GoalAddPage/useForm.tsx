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

interface FormState {
  spaceID: string;
  company: Companies.Company;
  me: People.Person;

  name: string;
  champion: People.Person | null;
  reviewer: People.Person | null;
  timeframe: TimeframeOption;
  targets: Target[];

  setName: (name: string) => void;
  setChampion: (champion: People.Person | null) => void;
  setReviewer: (reviewer: People.Person | null) => void;
  setTimeframe: (timeframe: TimeframeOption) => void;
  addTarget: () => void;
  removeTarget: (id: string) => void;
  updateTarget: (id: string, field: any, value: any) => void;

  isValid: boolean;
  submit: () => void;
  cancel: () => void;
  submitting: boolean;
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
  const [timeframe, setTimeframe] = useTimeframe();
  const [targets, addTarget, removeTarget, updateTarget] = useTargets();

  const isValid = validateForm(name, champion, reviewer, timeframe, targets);
  const [submit, cancel, submitting] = useSubmit(spaceID, name, champion, reviewer, timeframe, targets);

  return {
    spaceID,
    company,
    me,

    name,
    champion,
    reviewer,
    timeframe,
    targets,

    setName,
    setChampion,
    setReviewer,
    setTimeframe,
    addTarget,
    removeTarget,
    updateTarget,

    isValid,
    submit,
    cancel,
    submitting,
  };
}

function useTimeframe(): [TimeframeOption, (timeframe: TimeframeOption) => void] {
  const [timeframe, setTimeframe] = React.useState<TimeframeOption>({
    value: Time.currentYear().toString(),
    label: `${Time.currentYear()} (Current Year)`,
  });

  return [timeframe, setTimeframe];
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

// export function useForm(company: Companies.Company, me: People.Person): FormState {
//   const { spaceID } = useLoadedData();
//   const navigate = useNavigate();

//   const cancel = useNavigateTo(createPath("spaces", spaceID));
//   const timeframe = useTimeframe();
//   const targetList = useTargetList();

//   const [name, setName] = React.useState<string>("");
//   const [champion, setChampion] = React.useState<People.Person | null>(me);
//   const [reviewer, setReviewer] = React.useState<People.Person | null>(null);

//   const nameIsValid = () => name.length > 0;
//   const championIsValid = () => champion !== null;
//   const reviewerIsValid = () => reviewer !== null;
//   const timeframeIsValid = () => timeframe.selected.value !== null && timeframe.selected.value !== null;

//   const isValid = timeframeIsValid() && nameIsValid() && championIsValid() && reviewerIsValid();

//   const [create, { loading: submitting }] = Goals.useCreateGoalMutation({
//     onCompleted: (data: any) => navigate(createPath("goals", data.createGoal.id)),
//   });

//   const submit = async () => {
//     const selectedQuarter = timeframe.quarter.selected.value;
//     const selectedYear = timeframe.year.selected.value;
//     const timeframeCombined = selectedQuarter === "Whole Year" ? selectedYear : `${selectedYear}-${selectedQuarter}`;

//     await create({
//       variables: {
//         input: {
//           name,
//           spaceId: spaceID,
//           championID: champion,
//           reviewerID: reviewer,
//           timeframe: timeframeCombined,
//         },
//       },
//     });
//   };

//   return {
//     spaceID,
//     company,
//     me,

//     name,
//     setName,

//     champion,
//     setChampion,

//     reviewer,
//     setReviewer,

//     isValid,
//     submit,
//     cancel,
//     submitting,
//   };
// }

// function useTimeframe(): TimeframeState {
//   const currentYear = Time.currentYear();

//   const options = [{ value: currentYear.toString(), label: `${currentYear} (Current Year)` }];

//   const [selected, setSelected] = React.useState<Option>(options[0]);

//   return {
//     options: options,
//     default: options[0],
//     selected: options[0],
//     setSelected: (e: any) => setSelected(e.target.value),
//   };
// }

// function isCurrentQuarter(quarter: number, year: string) {
//   const currentYear = Time.currentYear();
//   const currentQuarter = Time.currentQuarter();

//   return quarter === currentQuarter && year === currentYear.toString();
// }

// function getDefaultQuarterOption(quarterOptions: Option[], year: string): Option {
//   const currentYear = Time.currentYear();
//   if (year !== currentYear.toString()) return quarterOptions[1] as Option;

//   const currentQuarter = Time.currentQuarter();
//   return quarterOptions.find((o) => o.value === `Q${currentQuarter}`) as Option;
// }

// interface TargetListState {
//   targets: TargetState[];
//   addTarget: () => void;
//   removeTarget: (id: string) => void;
//   updateTarget: (id: string, field: any, value: any) => void;
// }

// interface TargetState {
//   id: string;
//   name: string;
//   from: string;
//   to: string;
//   unit: string;
// }

// function newTarget() {
//   return {
//     id: Math.random().toString(),
//     name: "",
//     from: "",
//     to: "",
//     unit: "",
//   };
// }

// function useTargetList(): TargetListState {
//   const [targets, setTargets] = React.useState<TargetState[]>([newTarget(), newTarget(), newTarget()]);

//   const addTarget = () => {
//     setTargets((prev) => [...prev, newTarget()]);
//   };

//   const removeTarget = (id: string) => {
//     setTargets((prev) => prev.filter((t) => t.id !== id));
//   };

//   const updateTarget = (id: string, field: any, value: any) => {
//     setTargets((prev) => {
//       const target = prev.find((t) => t.id === id);
//       if (!target) return prev;

//       const updated = { ...target, [field]: value };
//       return prev.map((t) => (t.id === id ? updated : t));
//     });
//   };

//   return {
//     targets,
//     addTarget,
//     removeTarget,
//     updateTarget,
//   };
// }
