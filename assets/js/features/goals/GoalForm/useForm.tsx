import * as React from "react";
import * as Companies from "@/models/companies";
import * as Goals from "@/models/goals";
import * as People from "@/models/people";
import * as TipTapEditor from "@/components/Editor";
import * as Spaces from "@/models/spaces";
import * as Timeframes from "@/utils/timeframes";

import { createPath } from "@/utils/paths";
import { useNavigateTo } from "@/routes/useNavigateTo";
import { useNavigate } from "react-router-dom";
import { useListState } from "@/utils/useListState";

export interface FormState {
  config: FormConfig;
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
  parentGoal: Goals.Goal | null;
  champion: People.Person | null;
  reviewer: People.Person | null;
  timeframe: Timeframes.Timeframe;
  targets: Target[];
  space: SpaceOption | null;
  spaceOptions: SpaceOption[];
  hasDescription: boolean;
  descriptionEditor: TipTapEditor.Editor;

  setName: (name: string) => void;
  setChampion: (champion: People.Person | null) => void;
  setReviewer: (reviewer: People.Person | null) => void;
  setTimeframe: Timeframes.SetTimeframe;
  addTarget: () => void;
  removeTarget: (id: string) => void;
  updateTarget: (id: string, field: any, value: any) => void;
  setSpace: (space: SpaceOption | null) => void;
  setHasDescription: (hasDescription: boolean) => void;
  setParentGoal: (goal: Goals.Goal | null) => void;
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

interface FormConfig {
  mode: "create" | "edit";
  company: Companies.Company;
  me: People.Person;
  goal?: Goals.Goal;
  parentGoal?: Goals.Goal;
  parentGoalOptions?: Goals.Goal[];

  allowSpaceSelection: boolean;
  space?: Spaces.Space;
  spaces?: Spaces.Space[];

  isCompanyWide?: boolean;
}

export function useForm(config: FormConfig): FormState {
  const [name, setName] = React.useState<string>(config.goal?.name || "");
  const [champion, setChampion] = React.useState<People.Person | null>(config.goal?.champion || config.me);
  const [reviewer, setReviewer] = React.useState<People.Person | null>(config.goal?.reviewer || null);
  const [targets, addTarget, removeTarget, updateTarget] = useTargets(config);
  const [space, setSpace, spaceOptions] = useSpaces(config);
  const [parentGoal, setParentGoal] = React.useState<Goals.Goal | null>(config.parentGoal || null);
  const [timeframe, setTimeframe] = useTimeframe(config);

  const [hasDescription, setHasDescription] = React.useState<boolean>(false);
  const { editor: descriptionEditor } = TipTapEditor.useEditor({
    autoFocus: false,
    placeholder: "Write a description...",
    className: "min-h-[150px] p-2 py-1",
  });

  const fields = {
    company: config.company,
    me: config.me,

    name,
    champion,
    reviewer,
    timeframe,
    targets,
    space,
    spaceOptions,
    hasDescription,
    descriptionEditor,
    parentGoal,

    setName,
    setChampion,
    setReviewer,
    setTimeframe,
    addTarget,
    removeTarget,
    updateTarget,
    setSpace,
    setHasDescription,
    setParentGoal,
  } as Fields;

  const [submit, cancel, submitting, errors] = useSubmit(fields, config);

  return {
    config,
    fields,
    errors,
    submitting,
    submit,
    cancel,
  };
}

function useTimeframe(config: FormConfig): [Timeframes.Timeframe, Timeframes.SetTimeframe] {
  return React.useState<Timeframes.Timeframe>(() => {
    if (config.mode === "edit") {
      return Timeframes.parse(config.goal!.timeframe!);
    } else {
      return Timeframes.currentQuarter();
    }
  });
}

function useSpaces(config: FormConfig): [SpaceOption | null, (space: SpaceOption | null) => void, SpaceOption[]] {
  const [space, setSpace] = React.useState<Fields["space"]>(() => {
    if (config.allowSpaceSelection || config.mode === "edit") {
      return null;
    } else {
      return { value: config.space!.id!, label: config.space!.name! };
    }
  });

  const options = React.useMemo(() => {
    if (config.mode === "edit") return [];

    if (config.allowSpaceSelection) {
      const spaces = Spaces.sortSpaces(config.spaces!);

      return spaces.map((space) => ({ value: space.id!, label: space.name! }));
    } else {
      return [];
    }
  }, [config.spaces, config.allowSpaceSelection]);

  return [space, setSpace, options];
}

type TargetList = Target[];
type AddTarget = (target: Target) => void;
type RemoveTarget = (id: string) => void;
type UpdateTarget = (id: string, field: string, value: any) => void;

function useTargets(config: FormConfig): [TargetList, AddTarget, RemoveTarget, UpdateTarget] {
  const [list, { add, remove, update }] = useListState<Target>((): Target[] => {
    if (config.mode === "edit") {
      return (config.goal?.targets || [])
        .map((t) => t!)
        .map((t) => ({
          id: t.id!,
          name: t.name!,
          from: t.from!.toString(),
          to: t.to!.toString(),
          unit: t.unit!,
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
    isNew: true,
    id: Math.random().toString(),
    name: "",
    from: "",
    to: "",
    unit: "",
  };
}

function useSubmit(fields: Fields, config: FormConfig): [() => Promise<boolean>, () => void, boolean, Error[]] {
  const navigate = useNavigate();

  const cancel = useNavigateTo(createCancelPath(config));

  const [create, { loading: submittingCreate }] = Goals.useCreateGoalMutation({
    onCompleted: (data: any) => navigate(createPath("goals", data.createGoal.id)),
  });

  const [edit, { loading: submittingEdit }] = Goals.useEditGoalMutation({
    onCompleted: (data: any) => navigate(createPath("goals", data.editGoal.id)),
  });

  const submitting = submittingCreate || submittingEdit;

  const [errors, setErrors] = React.useState<Error[]>([]);

  const submit = async () => {
    const errors = validateForm(fields, config);

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    if (config.mode === "create") {
      await create({
        variables: {
          input: {
            name: fields.name,
            spaceId: fields.space!.value,
            championID: fields.champion!.id,
            reviewerID: fields.reviewer!.id,
            timeframe: Timeframes.serialize(fields.timeframe),
            description: prepareDescriptionForSave(fields),
            parentGoalId: config.parentGoal?.id,
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
            goalId: config.goal!.id,
            name: fields.name,
            championID: fields.champion!.id,
            reviewerID: fields.reviewer!.id,
            timeframe: Timeframes.serialize(fields.timeframe),
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

  return [submit, cancel, submitting, errors];
}

function validateForm(fields: Fields, config: FormConfig): Error[] {
  const mode = config.mode;
  const errors: Error[] = [];

  if (fields.name.length === 0) errors.push({ field: "name", message: "Name is required" });
  if (fields.champion === null) errors.push({ field: "champion", message: "Champion is required" });
  if (fields.reviewer === null) errors.push({ field: "reviewer", message: "Reviewer is required" });
  if (fields.timeframe === null) errors.push({ field: "timeframe", message: "Timeframe is required" });
  if (fields.space === null && mode === "create") errors.push({ field: "space", message: "Space is required" });

  if (fields.parentGoal === null && !config.isCompanyWide && mode === "create") {
    errors.push({ field: "parentGoal", message: "Parent goal is required" });
  }

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

  const submittableTargets = fields.targets.filter((t) => t.name.trim() !== "");

  if (submittableTargets.length === 0) {
    errors.push({ field: "targets", message: "At least one target is required" });
  }

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

function createCancelPath(config: FormConfig): string {
  if (config.mode === "edit") {
    return createPath("goals", config.goal?.id);
  } else if (config.allowSpaceSelection) {
    return "/goals";
  } else {
    return createPath("group", config.space!.id);
  }
}
