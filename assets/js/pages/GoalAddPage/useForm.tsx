import * as React from "react";
import * as Companies from "@/models/companies";
import * as Time from "@/utils/time";
import * as Goals from "@/models/goals";
import * as People from "@/models/people";
import * as TipTapEditor from "@/components/Editor";
import * as Groups from "@/models/groups";

import { createPath } from "@/utils/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { useNavigate } from "react-router-dom";
import { useListState } from "@/utils/useListState";
import { useLoadedData } from "./loader";

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

  name: string;
  champion: People.Person | null;
  reviewer: People.Person | null;
  timeframe: TimeframeOption;
  timeframeOptions: TimeframeOption[];
  targets: Target[];
  space: SpaceOption | null;
  spaceOptions: SpaceOption[];
  hasDescription: boolean;
  descriptionEditor: TipTapEditor.Editor;

  setName: (name: string) => void;
  setChampion: (champion: People.Person | null) => void;
  setReviewer: (reviewer: People.Person | null) => void;
  setTimeframe: (timeframe: TimeframeOption) => void;
  addTarget: () => void;
  removeTarget: (id: string) => void;
  updateTarget: (id: string, field: any, value: any) => void;
  setSpace: (space: SpaceOption | null) => void;
  setHasDescription: (hasDescription: boolean) => void;
}

interface TimeframeOption {
  value: string;
  label: string;
}

interface SpaceOption {
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

export function useForm(company: Companies.Company, me: People.Person, initialSpaceId?: string): FormState {
  const [name, setName] = React.useState<string>("");
  const [champion, setChampion] = React.useState<People.Person | null>(me);
  const [reviewer, setReviewer] = React.useState<People.Person | null>(null);
  const [timeframe, setTimeframe, timeframeOptions] = useTimeframe();
  const [targets, addTarget, removeTarget, updateTarget] = useTargets();
  const [space, setSpace, spaceOptions] = useSpaces();

  const [hasDescription, setHasDescription] = React.useState<boolean>(false);
  const { editor: descriptionEditor } = TipTapEditor.useEditor({
    autoFocus: false,
    placeholder: "Write a description...",
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[150px] p-2 py-1",
  });

  const fields = {
    company,
    me,

    name,
    champion,
    reviewer,
    timeframe,
    timeframeOptions,
    targets,
    space,
    spaceOptions,
    hasDescription,
    descriptionEditor,

    setName,
    setChampion,
    setReviewer,
    setTimeframe,
    addTarget,
    removeTarget,
    updateTarget,
    setSpace,
    setHasDescription,
  } as Fields;

  const cancelPath = initialSpaceId ? createPath("group", initialSpaceId) : "/goals";

  const [submit, cancel, submitting, errors] = useSubmit(fields, cancelPath);

  return {
    fields,
    errors,
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

function useSpaces(): [Fields["space"], Fields["setSpace"], Fields["spaceOptions"]] {
  const loaded = useLoadedData();

  const [space, setSpace] = React.useState<Fields["space"]>(() => {
    if (loaded.allowSpaceSelection) {
      return null;
    } else {
      return { value: loaded.space!.id, label: loaded.space!.name };
    }
  });

  const options = React.useMemo(() => {
    if (loaded.allowSpaceSelection) {
      const spaces = Groups.sortGroups(loaded.spaces!);

      return spaces.map((space) => ({ value: space.id, label: space.name }));
    } else {
      return [];
    }
  }, [loaded.spaces]);

  return [space, setSpace, options];
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

function useSubmit(fields: Fields, cancelPath: string): [() => Promise<boolean>, () => void, boolean, Error[]] {
  const navigate = useNavigate();

  const [create, { loading: submitting }] = Goals.useCreateGoalMutation({
    onCompleted: (data: any) => navigate(createPath("goals", data.createGoal.id)),
  });

  const [errors, setErrors] = React.useState<Error[]>([]);

  const submit = async () => {
    const errors = validateForm(fields);

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    await create({
      variables: {
        input: {
          name: fields.name,
          spaceId: fields.space!.value,
          championID: fields.champion!.id,
          reviewerID: fields.reviewer!.id,
          timeframe: fields.timeframe.value,
          description: fields.hasDescription ? JSON.stringify(fields.descriptionEditor.getJSON()) : null,
          targets: fields.targets
            .filter((t) => t.name.trim() !== "")
            .map((t, index) => ({
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

  const cancel = useNavigateTo(cancelPath);

  return [submit, cancel, submitting, errors];
}

function validateForm(fields: Fields): Error[] {
  const errors: Error[] = [];

  if (fields.name.length === 0) errors.push({ field: "name", message: "Name is required" });
  if (fields.champion === null) errors.push({ field: "champion", message: "Champion is required" });
  if (fields.reviewer === null) errors.push({ field: "reviewer", message: "Reviewer is required" });
  if (fields.timeframe.value === null) errors.push({ field: "timeframe", message: "Timeframe is required" });
  if (fields.space === null) errors.push({ field: "space", message: "Space is required" });

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
