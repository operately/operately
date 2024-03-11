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

export interface FormState {
  mode: "create" | "edit";
  spaceConfig: SpaceConfig;
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
  isNew?: boolean;
}

interface SpaceConfig {
  allowSpaceSelection: boolean;
  space?: Groups.Group;
  spaces?: Groups.Group[];
}

export function useForm(
  mode: "create" | "edit",
  company: Companies.Company,
  me: People.Person,
  spaceConfig: SpaceConfig,
  goal?: Goals.Goal,
): FormState {
  const [name, setName] = React.useState<string>(goal?.name || "");
  const [champion, setChampion] = React.useState<People.Person | null>(goal?.champion || me);
  const [reviewer, setReviewer] = React.useState<People.Person | null>(goal?.reviewer || null);
  const [timeframe, setTimeframe, timeframeOptions] = useTimeframe(mode, goal);
  const [targets, addTarget, removeTarget, updateTarget] = useTargets(mode, goal);
  const [space, setSpace, spaceOptions] = useSpaces(mode, spaceConfig);

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

  const cancelPath = createCancelPath(mode, spaceConfig, space, goal);
  const [submit, cancel, submitting, errors] = useSubmit(fields, cancelPath, mode, goal);

  return {
    mode,
    spaceConfig,
    fields,
    errors,
    submitting,
    submit,
    cancel,
  };
}

function useTimeframe(
  mode: "create" | "edit",
  goal?: Goals.Goal,
): [TimeframeOption, (timeframe: TimeframeOption) => void, TimeframeOption[]] {
  let options: TimeframeOption[] = [
    { value: Time.nQuartersFromNow(0), label: `${Time.nQuartersFromNow(0)}` },
    { value: Time.nQuartersFromNow(1), label: `${Time.nQuartersFromNow(1)}` },
    { value: Time.nQuartersFromNow(2), label: `${Time.nQuartersFromNow(2)}` },
    { value: Time.nQuartersFromNow(3), label: `${Time.nQuartersFromNow(3)}` },
    { value: Time.currentYear().toString(), label: `${Time.currentYear()}` },
    { value: Time.nextYear().toString(), label: `${Time.nextYear()}` },
  ];

  if (mode === "edit") {
    options = options.filter((o) => o.value !== goal?.timeframe);
    options.unshift({ value: goal!.timeframe, label: goal!.timeframe });
  }

  const [timeframe, setTimeframe] = React.useState<TimeframeOption>(options[0]!);
  return [timeframe, setTimeframe, options];
}

function useSpaces(
  mode: "create" | "edit",
  spaceConfig: SpaceConfig,
): [SpaceOption | null, (space: SpaceOption | null) => void, SpaceOption[]] {
  const [space, setSpace] = React.useState<Fields["space"]>(() => {
    if (spaceConfig.allowSpaceSelection || mode === "edit") {
      return null;
    } else {
      return { value: spaceConfig.space!.id, label: spaceConfig.space!.name };
    }
  });

  const options = React.useMemo(() => {
    if (mode === "edit") return [];

    if (spaceConfig.allowSpaceSelection) {
      const spaces = Groups.sortGroups(spaceConfig.spaces!);

      return spaces.map((space) => ({ value: space.id, label: space.name }));
    } else {
      return [];
    }
  }, [spaceConfig.spaces, spaceConfig.allowSpaceSelection]);

  return [space, setSpace, options];
}

type TargetList = Target[];
type AddTarget = (target: Target) => void;
type RemoveTarget = (id: string) => void;
type UpdateTarget = (id: string, field: string, value: any) => void;

function useTargets(mode: "create" | "edit", goal?: Goals.Goal): [TargetList, AddTarget, RemoveTarget, UpdateTarget] {
  const [list, { add, remove, update }] = useListState<Target>((): Target[] => {
    if (mode === "edit") {
      return (goal?.targets! || [])
        .map((t) => t!)
        .map((t) => ({
          id: t.id,
          name: t.name,
          from: t.from.toString(),
          to: t.to.toString(),
          unit: t.unit,
        }));
    } else {
      return [newEmptyTarget(), newEmptyTarget(), newEmptyTarget()];
    }
  });

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

function useSubmit(
  fields: Fields,
  cancelPath: string,
  mode: "create" | "edit",
  goal?: Goals.Goal,
): [() => Promise<boolean>, () => void, boolean, Error[]] {
  const navigate = useNavigate();

  const [create, { loading: submittingCreate }] = Goals.useCreateGoalMutation({
    onCompleted: (data: any) => navigate(createPath("goals", data.createGoal.id)),
  });

  const [edit, { loading: submittingEdit }] = Goals.useEditGoalMutation({
    onCompleted: (data: any) => navigate(createPath("goals", data.editGoal.id)),
  });

  const submitting = submittingCreate || submittingEdit;

  const [errors, setErrors] = React.useState<Error[]>([]);

  const submit = async () => {
    const errors = validateForm(fields);

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    if (mode === "create") {
      await create({
        variables: {
          input: {
            name: fields.name,
            spaceId: fields.space!.value,
            championID: fields.champion!.id,
            reviewerID: fields.reviewer!.id,
            timeframe: fields.timeframe.value,
            description: prepareDescriptionForSave(fields),
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
    } else {
      await edit({
        variables: {
          input: {
            goalId: goal!.id,
            name: fields.name,
            championID: fields.champion!.id,
            reviewerID: fields.reviewer!.id,
            timeframe: fields.timeframe.value,
            description: prepareDescriptionForSave(fields),
            addedTargets: fields.targets
              .filter((t) => t.name.trim() !== "")
              .filter((t) => t.isNew)
              .map((t, index) => ({
                name: t.name,
                from: parseInt(t.from),
                to: parseInt(t.to),
                unit: t.unit,
                index: index,
              })),
            updatedTargets: fields.targets
              .filter((t) => t.name.trim() !== "")
              .filter((t) => !t.isNew)
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
    }

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

function prepareDescriptionForSave(fields: Fields): string | null {
  if (!fields.hasDescription) return null;

  const content = fields.descriptionEditor.getJSON();
  if (!content) return null;

  const innerContent = content["content"];
  if (!innerContent) return null;
  if (innerContent.length === 0) return null;

  if (innerContent.length === 1 && innerContent[0]!["type"] === "paragraph") {
    const firstElement = innerContent[0];
    if (!firstElement) return null;
    if (!firstElement["content"]) return null;

    if (firstElement["content"].length === 0) return null;
    if (firstElement["content"][0]!.text?.trim() === "") return null;
  }

  return JSON.stringify(content);
}

function createCancelPath(
  mode: "create" | "edit",
  spaceConfig: SpaceConfig,
  space: SpaceOption | null,
  goal?: Goals.Goal,
): string {
  if (mode === "edit") {
    return createPath("goals", goal?.id);
  } else if (spaceConfig.allowSpaceSelection) {
    return "/goals";
  } else {
    return createPath("group", space!.value);
  }
}
