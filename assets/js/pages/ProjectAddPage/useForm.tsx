import React from "react";

import { useNavigate } from "react-router-dom";

import * as People from "@/models/people";
import * as Projects from "@/graphql/Projects";
import * as Companies from "@/models/companies";

export interface FormState {
  fields: Fields;
  errors: Error[];
  submitting: boolean;
  submit: () => Promise<boolean>;
  cancel: () => void;
}

interface Fields {
  company: Companies.Company;
  spaceID: string;
  me: People.Person;

  name: string;
  champion: People.Person | null;
  creatorRole: Option | null;
  visibility: string | null;

  setName: (name: string) => void;
  setChampion: (champion: People.Person) => void;
  setCreatorRole: (role: Option) => void;
  setVisibility: (visibility: string) => void;
}

interface Option {
  value: string;
  label: string;
}

interface Error {
  field: string;
  message: string;
}

export function useForm(company: Companies.Company, spaceID: string, me: People.Person): FormState {
  const [name, setName] = React.useState("");
  const [champion, setChampion] = React.useState<People.Person | null>(me);
  const [visibility, setVisibility] = React.useState<string | null>("everyone");
  const [creatorRole, setCreatorRole] = React.useState<{ value: string; label: string } | null>(null);

  const fields = {
    company: company,
    spaceID: spaceID,
    me: me,

    name,
    champion,
    creatorRole,
    visibility,

    setName,
    setChampion,
    setCreatorRole,
    setVisibility,
  };

  const { submit, submitting, cancel, errors } = useSubmit(fields);

  return {
    fields,
    errors,
    submitting,
    submit,
    cancel,
  };
}

function useSubmit(fields: Fields) {
  const navigate = useNavigate();

  const [errors, setErrors] = React.useState<Error[]>([]);

  const [add, { loading: submitting }] = Projects.useCreateProject({
    onCompleted: (data: any) => navigate(`/projects/${data?.createProject?.id}`),
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
          visibility: fields.visibility,
          creatorRole: fields.creatorRole?.value,
          spaceId: fields.spaceID,
        },
      },
    });

    return true;
  };

  const cancel = () => navigate(`/spaces/${fields.spaceID}`);

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

  if (fields.visibility === null) {
    result.push({ field: "visibility", message: "Visibility is required" });
  }

  if (fields.champion?.id !== fields.me.id && fields.creatorRole === null) {
    result.push({ field: "creatorRole", message: "Role is required" });
  }

  return result;
}
