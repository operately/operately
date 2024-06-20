import * as React from "react";
import * as Projects from "@/models/projects";

import { useNavigateTo } from "@/routes/useNavigateTo";
import { createPath } from "@/utils/paths";
import { useAddResource } from "@/models/keyResources";

interface FormState {
  projectId: string;
  resourceType: string;

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
        input: {
          project_id: project.id,
          title: name,
          link: url,
          resourceType,
        },
      },
    });
  }, [name, url, resourceType]);

  return {
    projectId: project.id!,
    resourceType,

    name,
    setName,
    url,
    setUrl,

    submit,
    submitting: loading,
    isValid,
  };
}
