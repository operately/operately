import * as React from "react";
import * as Projects from "@/graphql/Projects";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { createPath } from "@/utils/paths";
import { useAddResource } from "@/models/key_resources";

interface FormState {
  name: string;
  setName: (name: string) => void;

  url: string;
  setUrl: (url: string) => void;

  submit: () => void;
  submitting: boolean;
  isValid: boolean;
}

export function useForm(project: Projects.Project, resourceType: string): FormState {
  const gotoResourceList = useNavigateTo(createPath("projects", project.id, "edit", "resources"));

  const [name, setName] = React.useState("");
  const [url, setUrl] = React.useState("");

  const isValid = React.useMemo(() => {
    return name.length > 0 && url.length > 0;
  }, [name, url]);

  const [add, { loading }] = useAddResource({
    onCompleted: gotoResourceList,
  });

  const submit = React.useCallback(async () => {
    await add({
      variables: {
        project_id: project.id,
        name,
        link: url,
        resourceType,
      },
    });
  }, [name, url, resourceType]);

  return {
    name,
    setName,
    url,
    setUrl,

    submit,
    submitting: loading,
    isValid,
  };
}
