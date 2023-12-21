import { useLoadedData } from "./loader";
import { useNavigate } from "react-router-dom";

import * as TipTapEditor from "@/components/Editor";
import * as People from "@/graphql/People";
import * as Projects from "@/graphql/Projects";

export function useForm() {
  const { goal } = useLoadedData();

  const navigate = useNavigate();

  const editor = TipTapEditor.useEditor({
    placeholder: `Write your updates here...`,
    peopleSearch: People.usePeopleSearch(),
    className: "min-h-[350px] py-2 font-medium",
  });

  const [post] = Projects.usePostUpdate({
    onCompleted: (data: any) => navigate(`/goals/${goal.id}/check-ins/${data.createUpdate.id}`),
  });

  const submit = () => {
    if (!editor.editor) return;
    if (editor.uploading) return;

    post({
      variables: {
        input: {
          updatableType: "goal",
          updatableId: goal.id,
          content: JSON.stringify(editor.editor.getJSON()),
          messageType: "check-in",
        },
      },
    });
  };

  return { editor, submit };
}
