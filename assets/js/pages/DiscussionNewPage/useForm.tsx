import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as Discussions from "@/models/discussions";
import * as People from "@/models/people";

import { useNavigate } from "react-router-dom";
import { useLoadedData } from "./loader";

interface Error {
  field: string;
  message: string;
}

interface Fields {
  title: string;
  editor: string;
  setTitle: (title: string) => void;
}

export interface FormState {
  errors: Error[];
  fields: Fields;

  empty: boolean;
  uploading: boolean;
  loading: boolean;

  submit: () => void;
}

export function useForm(): FormState {
  const { space } = useLoadedData();
  const navigate = useNavigate();

  const [title, setTitle] = React.useState("");

  const peopleSearch = People.usePeopleSearch();

  const { editor, uploading, empty } = TipTapEditor.useEditor({
    placeholder: "Write here...",
    peopleSearch: peopleSearch,
    className: "min-h-[350px] py-2 px-1",
  });

  const [post, { loading }] = Discussions.usePost({
    onCompleted: (data: any) => navigate(`/spaces/${space.id}/discussions/${data.createUpdate.id}`),
  });

  const submit = async () => {
    if (!editor) return;
    if (uploading) return;

    await post({
      variables: {
        input: {
          updatableType: "group",
          updatableId: space.id,
          content: JSON.stringify({
            title: title,
            body: editor.getJSON(),
          }),
          messageType: "project_discussion",
        },
      },
    });
  };

  const fields: Fields = {
    title,
    setTitle,
    editor,
  };

  return {
    fields,
    uploading,
    empty,
    submit,
    loading,
    errors: [],
  };
}
