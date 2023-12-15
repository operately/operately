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
  reviewer: People.Person | null;
  creatorRole: string | null;
  visibility: string | null;
  creatorIsContributor: string;

  setName: (name: string) => void;
  setChampion: (champion: People.Person) => void;
  setReviewer: (reviewer: People.Person) => void;
  setCreatorRole: (role: string) => void;
  setVisibility: (visibility: string) => void;
  setCreatorIsContributor: (contributor: string) => void;

  amIChampion: boolean;
  amIReviewer: boolean;
  amIContributor: boolean;
  noAccess: boolean;
}

interface Error {
  field: string;
  message: string;
}

export function useForm(company: Companies.Company, spaceID: string, me: People.Person): FormState {
  const [name, setName] = React.useState("");
  const [champion, setChampion] = React.useState<People.Person | null>(me);
  const [reviewer, setReviewer] = React.useState<People.Person | null>(null);
  const [visibility, setVisibility] = React.useState<string | null>("everyone");
  const [creatorRole, setCreatorRole] = React.useState<string | null>(null);
  const [creatorIsContributor, setCreatorIsContributor] = React.useState<string>("no");

  const amIChampion = champion?.id === me.id;
  const amIReviewer = reviewer?.id === me.id;
  const amIContributor = amIChampion || amIReviewer || creatorIsContributor === "yes";
  const noAccess = !amIChampion && !amIReviewer && !amIContributor && visibility === "invite";

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

    setName,
    setChampion,
    setReviewer,
    setCreatorRole,
    setVisibility,
    setCreatorIsContributor,

    amIChampion,
    amIReviewer,
    amIContributor,
    noAccess,
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
    onCompleted: (data: any) => {
      if (fields.noAccess) {
        navigate(`/spaces/${fields.spaceID}`);
      } else {
        navigate(`/projects/${data?.createProject?.id}`);
      }
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

  if (fields.reviewer === null) {
    result.push({ field: "reviewer", message: "Reviewer is required" });
  }

  if (fields.visibility === null) {
    result.push({ field: "visibility", message: "Visibility is required" });
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
