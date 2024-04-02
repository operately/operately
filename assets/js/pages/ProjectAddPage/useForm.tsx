import React from "react";

import { useNavigate } from "react-router-dom";

import * as People from "@/models/people";
import * as Projects from "@/models/projects";
import * as Companies from "@/models/companies";
import * as Groups from "@/models/groups";

import { useLoadedData } from "./loader";

export interface FormState {
  fields: Fields;
  errors: Error[];
  submitting: boolean;
  submit: () => Promise<boolean>;
  cancel: () => void;
}

interface Fields {
  company: Companies.Company;
  me: People.Person;

  name: string;
  champion: People.Person | null;
  reviewer: People.Person | null;
  creatorRole: string | null;
  visibility: string | null;
  creatorIsContributor: string;
  space: SpaceOption | null;
  spaceOptions: SpaceOption[];

  setName: (name: string) => void;
  setChampion: (champion: People.Person) => void;
  setReviewer: (reviewer: People.Person) => void;
  setCreatorRole: (role: string) => void;
  setVisibility: (visibility: string) => void;
  setCreatorIsContributor: (contributor: string) => void;
  setSpace: (space: SpaceOption | null) => void;

  amIChampion: boolean;
  amIReviewer: boolean;
  amIContributor: boolean;
}

interface SpaceOption {
  value: string;
  label: string;
}

interface Error {
  field: string;
  message: string;
}

export function useForm() {
  const { company, me, spaceID, goal } = useLoadedData();

  const [name, setName] = React.useState("");
  const [champion, setChampion] = React.useState<People.Person | null>(me);
  const [reviewer, setReviewer] = React.useState<People.Person | null>(null);
  const [visibility, setVisibility] = React.useState<string | null>("everyone");
  const [creatorRole, setCreatorRole] = React.useState<string | null>(null);
  const [creatorIsContributor, setCreatorIsContributor] = React.useState<string>("no");
  const [space, setSpace, spaceOptions] = useSpaces();

  const amIChampion = champion?.id === me.id;
  const amIReviewer = reviewer?.id === me.id;
  const amIContributor = amIChampion || amIReviewer || creatorIsContributor === "yes";

  //
  // If the creator is not a contributor, then they can't set the visibility to invite only
  // So we set the visibility to everyone
  //
  React.useEffect(() => {
    if (visibility === "invite") {
      setCreatorIsContributor("yes");
    }
  }, [visibility]);

  const fields = {
    company: company,
    spaceID: spaceID,
    me: me,

    name,
    champion,
    reviewer,
    creatorRole,
    visibility,
    creatorIsContributor,
    space,
    spaceOptions,

    setName,
    setChampion,
    setReviewer,
    setCreatorRole,
    setVisibility,
    setCreatorIsContributor,
    setSpace,

    amIChampion,
    amIReviewer,
    amIContributor,
  };

  const cancelPath = spaceID ? `/spaces/${spaceID}` : "/projects";

  const { submit, submitting, cancel, errors } = useSubmit(fields, cancelPath, goal?.id);

  return {
    fields,
    errors,
    submitting,
    submit,
    cancel,
  };
}

function useSubmit(fields: Fields, cancelPath: string, goalID: string | undefined) {
  const navigate = useNavigate();

  const [errors, setErrors] = React.useState<Error[]>([]);

  const [add, { loading: submitting }] = Projects.useCreateMutation({
    onCompleted: (data: any) => {
      navigate(`/projects/${data?.createProject?.id}`);
    },
  });

  const submit = async () => {
    let errors = validate(fields);

    if (errors.length > 0) {
      setErrors(errors);
      return false;
    }

    await add({
      variables: {
        input: {
          name: fields.name,
          championId: fields.champion!.id,
          reviewerId: fields.reviewer!.id,
          visibility: fields.visibility,
          creatorIsContributor: fields.creatorIsContributor,
          creatorRole: fields.creatorRole,
          spaceId: fields.space!.value,
          goalId: goalID,
        },
      },
    });

    return true;
  };

  const cancel = () => navigate(cancelPath);

  return {
    submit,
    cancel,
    submitting,
    errors,
  };
}

function validate(fields: Fields): Error[] {
  let result: Error[] = [];

  if (fields.name.length === 0) {
    result.push({ field: "name", message: "Name is required" });
  }

  if (fields.champion === null) {
    result.push({ field: "champion", message: "Champion is required" });
  }

  if (fields.reviewer === null) {
    result.push({ field: "reviewer", message: "Reviewer is required" });
  }

  if (fields.visibility === null) {
    result.push({ field: "visibility", message: "Visibility is required" });
  }

  if (fields.space === null) {
    result.push({ field: "space", message: "Space is required" });
  }

  if (fields.champion?.id !== fields.me.id && fields.reviewer?.id !== fields.me.id) {
    if (fields.creatorIsContributor === "yes") {
      if (fields.creatorRole === null) {
        result.push({ field: "creatorRole", message: "Role is required" });
      }
    }
  }

  return result;
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
