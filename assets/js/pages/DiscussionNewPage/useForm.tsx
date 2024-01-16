import * as React from "react";
import * as TipTapEditor from "@/components/Editor";
import * as People from "@/models/people";
import { useNavigate } from "react-router-dom";
import { useLoadedData } from "./loader";

interface Error {
  field: string;
  message: string;
}

export interface FormState {
  errors: Error[];
  title: string;
  editor: TipTapEditor.Editor | null;
  empty: boolean;
  uploading: boolean;
  loading: boolean;

  setTitle: (title: string) => void;
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

  // const [post, { loading }] = Projects.usePostUpdate({
  //   onCompleted: (data: any) => navigate(`/spaces/${space.id}/discussions/${data.createUpdate.id}`),
  // });

  const [post, { loading }] = [() => null, { loading: false }];

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

  return {
    title,
    setTitle,
    editor,
    uploading,
    empty,
    submit,
    loading,
    errors: [],
  };
}
